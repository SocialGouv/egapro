import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	logActionInTransaction: vi.fn(),
	mirror: vi.fn(),
	committed: false,
	onConflictDoUpdate: vi.fn(),
	releaseLocksForUserOnSirens: vi.fn(),
	revokedRows: [] as { siren: string }[],
}));

function fakeTx() {
	const insertChain = {
		values: () => ({
			onConflictDoUpdate: mocks.onConflictDoUpdate,
			onConflictDoNothing: async () => undefined,
		}),
	};
	return {
		execute: async () => undefined,
		insert: () => insertChain,
		delete: () => ({
			where: () => ({ returning: async () => mocks.revokedRows }),
		}),
	};
}

vi.unmock("../companyLink");
vi.mock("~/server/db", () => ({
	db: {
		transaction: async (work: (tx: unknown) => Promise<unknown>) => {
			const result = await work(fakeTx());
			mocks.committed = true;
			return result;
		},
	},
}));
vi.mock("~/server/audit/log", () => ({
	logActionInTransaction: mocks.logActionInTransaction,
}));
vi.mock("~/server/services/declarationLockService", () => ({
	releaseLocksForUserOnSirens: mocks.releaseLocksForUserOnSirens,
}));
vi.mock("~/server/services/weez", () => ({
	fetchCompanyBySiren: vi.fn().mockResolvedValue(null),
}));

import { syncUserCompanyLink } from "../companyLink";

const AUDIT = {
	userEmail: "email@example.fr",
	ipAddress: "203.0.113.1",
	userAgent: "Mozilla",
};

describe("syncUserCompanyLink — audit trail", () => {
	beforeEach(() => {
		mocks.committed = false;
		mocks.onConflictDoUpdate.mockReset();
		mocks.mirror.mockReset();
		mocks.logActionInTransaction.mockReset();
		mocks.logActionInTransaction.mockResolvedValue(mocks.mirror);
		mocks.releaseLocksForUserOnSirens.mockReset();
		mocks.releaseLocksForUserOnSirens.mockResolvedValue([]);
		mocks.revokedRows = [];
	});

	it("preserves a stored country when the registry returns no company", async () => {
		await syncUserCompanyLink("user-1", "22222222200015", AUDIT);
		const update = mocks.onConflictDoUpdate.mock.calls[0]?.[0];
		expect(update.set).not.toHaveProperty("countryCode");
		expect(update.set).not.toHaveProperty("countryLabel");
	});

	it("journals each revocation inside the transaction, with the reason and no other payload", async () => {
		mocks.revokedRows = [{ siren: "111111111" }];

		await syncUserCompanyLink("user-1", "22222222200015", AUDIT);

		expect(mocks.logActionInTransaction).toHaveBeenCalledWith(
			expect.objectContaining({ execute: expect.any(Function) }),
			{
				action: "auth.company_link_revoked",
				status: "success",
				userId: "user-1",
				userEmail: AUDIT.userEmail,
				siren: "111111111",
				metadata: { reason: "siret_changed" },
				ipAddress: AUDIT.ipAddress,
				userAgent: AUDIT.userAgent,
			},
		);
	});

	it("tags a revocation caused by a missing SIRET", async () => {
		mocks.revokedRows = [{ siren: "111111111" }];

		await syncUserCompanyLink("user-1", null, AUDIT);

		expect(mocks.logActionInTransaction).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ metadata: { reason: "siret_missing" } }),
		);
	});

	it("journals each edit lock released by force", async () => {
		mocks.revokedRows = [{ siren: "111111111" }];
		mocks.releaseLocksForUserOnSirens.mockResolvedValue([
			{ declarationId: "declaration-1", siren: "111111111" },
		]);

		await syncUserCompanyLink("user-1", "22222222200015", AUDIT);

		expect(mocks.logActionInTransaction).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				action: "declaration.lock_released",
				siren: "111111111",
				resourceType: "declaration",
				resourceId: "declaration-1",
				metadata: { reason: "company_link_revoked" },
			}),
		);
	});

	it("mirrors each row to stdout only once the transaction has committed", async () => {
		mocks.revokedRows = [{ siren: "111111111" }];
		mocks.mirror.mockImplementation(() => {
			expect(mocks.committed).toBe(true);
		});

		await syncUserCompanyLink("user-1", "22222222200015", AUDIT);

		expect(mocks.mirror).toHaveBeenCalledOnce();
	});

	it("journals nothing when no link was revoked", async () => {
		await syncUserCompanyLink("user-1", "22222222200015", AUDIT);

		expect(mocks.logActionInTransaction).not.toHaveBeenCalled();
	});

	it("fails the sync when the audit row cannot be written, so the revocation rolls back with it", async () => {
		mocks.revokedRows = [{ siren: "111111111" }];
		mocks.logActionInTransaction.mockRejectedValue(new Error("audit down"));

		await expect(
			syncUserCompanyLink("user-1", "22222222200015", AUDIT),
		).rejects.toThrow("audit down");
		expect(mocks.mirror).not.toHaveBeenCalled();
	});
});
