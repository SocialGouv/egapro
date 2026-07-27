import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));

import { syncCseRequirement } from "../cseRequirementSync";

const SIREN = "123456789";
const YEAR = 2026;

type DeclarationRow = {
	id: string;
	status: string;
	cseRequired: boolean;
	rulesVersion: string;
};

function declaration(overrides: Partial<DeclarationRow> = {}): DeclarationRow {
	return {
		id: "decl-1",
		status: "awaiting_cse_opinion",
		cseRequired: true,
		rulesVersion: "2027.1",
		...overrides,
	};
}

function makeDb(rows: DeclarationRow[]) {
	const set = vi
		.fn()
		.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
	const update = vi.fn().mockReturnValue({ set });

	const txSet = vi
		.fn()
		.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
	const txUpdate = vi.fn().mockReturnValue({ set: txSet });
	const txValues = vi.fn().mockResolvedValue(undefined);
	const txInsert = vi.fn().mockReturnValue({ values: txValues });

	const transaction = vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
		await cb({ insert: txInsert, update: txUpdate });
	});

	const select = vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				limit: vi.fn().mockResolvedValue(rows),
			}),
		}),
	});

	return {
		db: { select, update, transaction } as never,
		set,
		txSet,
		txValues,
		transaction,
	};
}

const BASE = { siren: SIREN, year: YEAR, actorUserId: "user-1" };

beforeEach(() => {
	vi.clearAllMocks();
});

describe("syncCseRequirement", () => {
	it("does nothing when there is no active declaration", async () => {
		const { db, set, transaction } = makeDb([]);

		await syncCseRequirement({ db, ...BASE, workforce: 601, hasCse: false });

		expect(set).not.toHaveBeenCalled();
		expect(transaction).not.toHaveBeenCalled();
	});

	it("does nothing when the snapshot already matches", async () => {
		const { db, set, transaction } = makeDb([
			declaration({ cseRequired: true }),
		]);

		await syncCseRequirement({ db, ...BASE, workforce: 601, hasCse: true });

		expect(set).not.toHaveBeenCalled();
		expect(transaction).not.toHaveBeenCalled();
	});

	it("closes a démarche parked on the CSE step once the CSE answer turns to no", async () => {
		// The #3951 dead end: the only way out used to be depositing an opinion
		// the company cannot produce.
		const { db, txSet, txValues, transaction } = makeDb([declaration()]);

		await syncCseRequirement({ db, ...BASE, workforce: 601, hasCse: false });

		expect(transaction).toHaveBeenCalledTimes(1);
		expect(txSet).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "demarche_completed",
				cseRequired: false,
			}),
		);
		expect(txValues).toHaveBeenCalledWith([
			expect.objectContaining({
				declarationId: "decl-1",
				eventType: "demarche_complete",
				actorUserId: "user-1",
			}),
		]);
	});

	it("refreshes the snapshot without touching the status elsewhere in the journey", async () => {
		const { db, set, transaction } = makeDb([
			declaration({ status: "awaiting_compliance_path_choice" }),
		]);

		await syncCseRequirement({ db, ...BASE, workforce: 601, hasCse: false });

		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({ cseRequired: false }),
		);
		expect(set.mock.calls[0]?.[0]).not.toHaveProperty("status");
		expect(transaction).not.toHaveBeenCalled();
	});

	it("only refreshes the snapshot when the opinion becomes due again", async () => {
		// No transition needed: the engine already accepts submit_cse_opinion from
		// demarche_completed, so the company can still deposit its opinion.
		const { db, set, transaction } = makeDb([
			declaration({ status: "demarche_completed", cseRequired: false }),
		]);

		await syncCseRequirement({ db, ...BASE, workforce: 601, hasCse: true });

		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({ cseRequired: true }),
		);
		expect(transaction).not.toHaveBeenCalled();
	});

	it("does not close the démarche when the company is below the CSE threshold but keeps the snapshot false", async () => {
		const { db, txSet } = makeDb([declaration()]);

		await syncCseRequirement({ db, ...BASE, workforce: 70, hasCse: true });

		expect(txSet).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "demarche_completed",
				cseRequired: false,
			}),
		);
	});
});
