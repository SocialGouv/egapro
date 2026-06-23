import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildLockHolder } from "./helpers/lockTestHelpers";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

const mockLogAction = vi.fn();
vi.mock("~/server/audit/log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

const mocks = vi.hoisted(() => ({
	acquireOrRefreshLock: vi.fn(),
	getActiveLock: vi.fn(),
	refreshLock: vi.fn(),
	releaseLock: vi.fn(),
}));
vi.mock("~/server/services/declarationLockService", () => ({
	acquireOrRefreshLock: mocks.acquireOrRefreshLock,
	getActiveLock: mocks.getActiveLock,
	refreshLock: mocks.refreshLock,
	releaseLock: mocks.releaseLock,
}));

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
const USER_EMAIL = "user@example.com";
const USER_SIRET = "33978727700015";
const DECLARATION_ID = "decl-1";
const FOREIGN_DECLARATION_ID = "decl-foreign";

// Successive select chains: each `select()` resolves the next queued row set.
// resolveOwnDeclarationId is always first; readLockTimeoutMinutes (when the
// procedure reads it) is second.
function createSelectDb(responses: unknown[][]) {
	let index = 0;
	const select = vi.fn().mockImplementation(() => {
		const rows = responses[index] ?? [];
		index++;
		const limit = vi.fn().mockResolvedValue(rows);
		const where = vi.fn().mockReturnValue({ limit });
		const from = vi.fn().mockReturnValue({ where });
		return { from };
	});
	return { select } as unknown;
}

function createCaller(db: unknown, siret: string | null = USER_SIRET) {
	return import("~/server/api/routers/declarationLock").then(
		({ declarationLockRouter }) =>
			declarationLockRouter.createCaller({
				db,
				session: {
					user: {
						id: USER_ID,
						email: USER_EMAIL,
						siret,
						isAdmin: false,
						impersonation: null,
					},
					expires: "",
				},
				headers: new Headers(),
			} as never),
	);
}

beforeEach(() => {
	vi.resetAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("declarationLockRouter", () => {
	describe("acquireLock", () => {
		it("acquires the lock, returns the holder, and audits a single acquisition (S11)", async () => {
			const holder = buildLockHolder({ userId: USER_ID });
			mocks.acquireOrRefreshLock.mockResolvedValue({ acquired: true, holder });
			const db = createSelectDb([[{ id: DECLARATION_ID }], [{ minutes: 45 }]]);
			const caller = await createCaller(db);

			const result = await caller.acquireLock({
				declarationId: DECLARATION_ID,
			});

			expect(result).toEqual({ acquired: true, holder });
			expect(mocks.acquireOrRefreshLock).toHaveBeenCalledWith(
				db,
				DECLARATION_ID,
				USER_ID,
				45,
			);
			expect(mockLogAction).toHaveBeenCalledTimes(1);
			expect(mockLogAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "declaration.lock_acquired",
					status: "success",
					userId: USER_ID,
					resourceType: "declaration",
					resourceId: DECLARATION_ID,
				}),
			);
		});

		it("does not audit when the lock is already held by another user", async () => {
			const holder = buildLockHolder({ userId: OTHER_USER_ID });
			mocks.acquireOrRefreshLock.mockResolvedValue({ acquired: false, holder });
			const db = createSelectDb([[{ id: DECLARATION_ID }], [{ minutes: 30 }]]);
			const caller = await createCaller(db);

			const result = await caller.acquireLock({
				declarationId: DECLARATION_ID,
			});

			expect(result).toEqual({ acquired: false, holder });
			expect(mockLogAction).not.toHaveBeenCalled();
		});

		it("falls back to the default timeout when no global setting row exists", async () => {
			const holder = buildLockHolder({ userId: USER_ID });
			mocks.acquireOrRefreshLock.mockResolvedValue({ acquired: true, holder });
			const db = createSelectDb([[{ id: DECLARATION_ID }], []]);
			const caller = await createCaller(db);

			await caller.acquireLock({ declarationId: DECLARATION_ID });

			expect(mocks.acquireOrRefreshLock).toHaveBeenCalledWith(
				db,
				DECLARATION_ID,
				USER_ID,
				30,
			);
		});

		it("throws FORBIDDEN when the claimed declarationId is not the caller's (IDOR guard)", async () => {
			const db = createSelectDb([[{ id: DECLARATION_ID }]]);
			const caller = await createCaller(db);

			await expect(
				caller.acquireLock({ declarationId: FOREIGN_DECLARATION_ID }),
			).rejects.toMatchObject({ code: "FORBIDDEN" });
			expect(mocks.acquireOrRefreshLock).not.toHaveBeenCalled();
			expect(mockLogAction).not.toHaveBeenCalled();
		});

		it("throws NOT_FOUND when the caller has no current-year declaration", async () => {
			const db = createSelectDb([[]]);
			const caller = await createCaller(db);

			await expect(
				caller.acquireLock({ declarationId: DECLARATION_ID }),
			).rejects.toMatchObject({ code: "NOT_FOUND" });
			expect(mocks.acquireOrRefreshLock).not.toHaveBeenCalled();
		});
	});

	describe("heartbeat", () => {
		it("refreshes the lock and returns held=true, without auditing (S6)", async () => {
			mocks.refreshLock.mockResolvedValue(true);
			const db = createSelectDb([[{ id: DECLARATION_ID }], [{ minutes: 20 }]]);
			const caller = await createCaller(db);

			const result = await caller.heartbeat({
				declarationId: DECLARATION_ID,
			});

			expect(result).toEqual({ held: true });
			expect(mocks.refreshLock).toHaveBeenCalledWith(
				db,
				DECLARATION_ID,
				USER_ID,
				20,
			);
			expect(mockLogAction).not.toHaveBeenCalled();
		});

		it("returns held=false when the lock can no longer be refreshed (S7 lazy expiry)", async () => {
			mocks.refreshLock.mockResolvedValue(false);
			const db = createSelectDb([[{ id: DECLARATION_ID }], [{ minutes: 30 }]]);
			const caller = await createCaller(db);

			const result = await caller.heartbeat({
				declarationId: DECLARATION_ID,
			});

			expect(result).toEqual({ held: false });
		});
	});

	describe("releaseLock", () => {
		it("releases an own active lock, returns released=true, and audits it", async () => {
			mocks.getActiveLock.mockResolvedValue(
				buildLockHolder({ userId: USER_ID }),
			);
			mocks.releaseLock.mockResolvedValue(undefined);
			const db = createSelectDb([[{ id: DECLARATION_ID }]]);
			const caller = await createCaller(db);

			const result = await caller.releaseLock({
				declarationId: DECLARATION_ID,
			});

			expect(result).toEqual({ released: true });
			expect(mocks.releaseLock).toHaveBeenCalledWith(
				db,
				DECLARATION_ID,
				USER_ID,
			);
			expect(mockLogAction).toHaveBeenCalledTimes(1);
			expect(mockLogAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "declaration.lock_released",
					status: "success",
					resourceId: DECLARATION_ID,
				}),
			);
		});

		it("returns released=false and does not audit when the active lock is held by another user", async () => {
			mocks.getActiveLock.mockResolvedValue(
				buildLockHolder({ userId: OTHER_USER_ID }),
			);
			mocks.releaseLock.mockResolvedValue(undefined);
			const db = createSelectDb([[{ id: DECLARATION_ID }]]);
			const caller = await createCaller(db);

			const result = await caller.releaseLock({
				declarationId: DECLARATION_ID,
			});

			expect(result).toEqual({ released: false });
			expect(mockLogAction).not.toHaveBeenCalled();
		});

		it("returns released=false and does not audit when there is no active lock", async () => {
			mocks.getActiveLock.mockResolvedValue(null);
			mocks.releaseLock.mockResolvedValue(undefined);
			const db = createSelectDb([[{ id: DECLARATION_ID }]]);
			const caller = await createCaller(db);

			const result = await caller.releaseLock({
				declarationId: DECLARATION_ID,
			});

			expect(result).toEqual({ released: false });
			expect(mocks.releaseLock).toHaveBeenCalled();
			expect(mockLogAction).not.toHaveBeenCalled();
		});
	});

	describe("getLockState", () => {
		it("reports locked + isOwnLock when the caller holds the lock", async () => {
			const holder = buildLockHolder({ userId: USER_ID });
			mocks.getActiveLock.mockResolvedValue(holder);
			const db = createSelectDb([[{ id: DECLARATION_ID }]]);
			const caller = await createCaller(db);

			const result = await caller.getLockState({
				declarationId: DECLARATION_ID,
			});

			expect(result).toEqual({ locked: true, isOwnLock: true, holder });
		});

		it("reports locked but not isOwnLock when another co-declarant holds it", async () => {
			const holder = buildLockHolder({ userId: OTHER_USER_ID });
			mocks.getActiveLock.mockResolvedValue(holder);
			const db = createSelectDb([[{ id: DECLARATION_ID }]]);
			const caller = await createCaller(db);

			const result = await caller.getLockState({
				declarationId: DECLARATION_ID,
			});

			expect(result).toEqual({ locked: true, isOwnLock: false, holder });
		});

		it("reports an unlocked declaration when no active lock exists (S7)", async () => {
			mocks.getActiveLock.mockResolvedValue(null);
			const db = createSelectDb([[{ id: DECLARATION_ID }]]);
			const caller = await createCaller(db);

			const result = await caller.getLockState({
				declarationId: DECLARATION_ID,
			});

			expect(result).toEqual({ locked: false, isOwnLock: false, holder: null });
		});

		it("never acquires a lock (read-only poll)", async () => {
			mocks.getActiveLock.mockResolvedValue(null);
			const db = createSelectDb([[{ id: DECLARATION_ID }]]);
			const caller = await createCaller(db);

			await caller.getLockState({ declarationId: DECLARATION_ID });

			expect(mocks.acquireOrRefreshLock).not.toHaveBeenCalled();
			expect(mocks.refreshLock).not.toHaveBeenCalled();
		});

		it("throws FORBIDDEN on a foreign declarationId (IDOR guard)", async () => {
			const db = createSelectDb([[{ id: DECLARATION_ID }]]);
			const caller = await createCaller(db);

			await expect(
				caller.getLockState({ declarationId: FOREIGN_DECLARATION_ID }),
			).rejects.toMatchObject({ code: "FORBIDDEN" });
			expect(mocks.getActiveLock).not.toHaveBeenCalled();
		});
	});

	it("rejects every procedure when the SIRET is missing from the session", async () => {
		const db = createSelectDb([]);
		const caller = await createCaller(db, null);

		await expect(
			caller.acquireLock({ declarationId: DECLARATION_ID }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});
});
