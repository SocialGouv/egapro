import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/server/services/s3", () => ({
	deleteFile: vi.fn(),
}));

const DEFAULT_DECLARATION = {
	id: "decl-1",
	status: "awaiting_cse_opinion",
	rulesVersion: "2027.1",
	secondDeclarationStep: null,
};

type Opinion = {
	declarationNumber: number;
	type: string;
	gapConsulted: boolean | null;
};
type Association = { declarationNumber: number; type: string };

const FIRST_GAP_CONSULTED: Opinion[] = [
	{ declarationNumber: 1, type: "accuracy", gapConsulted: null },
	{ declarationNumber: 1, type: "gap", gapConsulted: true },
];

// Covers every type required by FIRST_GAP_CONSULTED so finalize passes the guard.
const ASSOCIATIONS_FIRST_GAP: Association[] = [
	{ declarationNumber: 1, type: "accuracy" },
	{ declarationNumber: 1, type: "gap" },
];

type CategoryRow = {
	declarationType: string;
	annualBaseWomen: string | null;
	annualBaseMen: string | null;
	annualVariableWomen: string | null;
	annualVariableMen: string | null;
	hourlyBaseWomen: string | null;
	hourlyBaseMen: string | null;
	hourlyVariableWomen: string | null;
	hourlyVariableMen: string | null;
};

// A category with a ~9% salary gap (>= the 5% alert threshold).
function gapCategory(declarationType: string): CategoryRow {
	return {
		declarationType,
		annualBaseWomen: "1000",
		annualBaseMen: "1100",
		annualVariableWomen: null,
		annualVariableMen: null,
		hourlyBaseWomen: null,
		hourlyBaseMen: null,
		hourlyVariableWomen: null,
		hourlyVariableMen: null,
	};
}

// Both declarations have a gap >= 5% by default, so the Justification gate turns
// purely on gapConsulted in the pre-existing guard tests.
const DEFAULT_CATEGORIES: CategoryRow[] = [
	gapCategory("initial"),
	gapCategory("correction"),
];

type FinalizeOptions = {
	opinionCount?: number;
	fileCount?: number;
	declaration?: Record<string, unknown> | null;
	txDraft?: Record<string, unknown> | null;
	opinions?: Opinion[];
	associations?: Association[];
	categories?: CategoryRow[];
	// When true, the matching count query resolves to [] so its row is undefined,
	// exercising the `?? 0` fallback in finalize().
	emptyOpinionCountRow?: boolean;
	emptyFileCountRow?: boolean;
};

// Select sequence of finalize():
//   1 middleware declaration-id lookup (.where().limit)
//   2 opinionCount (.where)
//   3 fileCount (.where)
//   4 declarationRow (.where().limit)
//   5 existingAssociations (.where)
//   6 opinions with gapConsulted (.where)
//   7 employee categories for the gap >= 5% gate (.innerJoin().where)
//   8 (inside tx) declRow for draft purge (.where().limit)
function createMockDbForFinalize(options: FinalizeOptions = {}) {
	const {
		opinionCount = 2,
		fileCount = 1,
		declaration = DEFAULT_DECLARATION,
		txDraft = null,
		opinions = FIRST_GAP_CONSULTED,
		associations = ASSOCIATIONS_FIRST_GAP,
		categories = DEFAULT_CATEGORIES,
		emptyOpinionCountRow = false,
		emptyFileCountRow = false,
	} = options;

	const declarationLookupRow = { id: "decl-1" };

	let selectCallCount = 0;
	const limit = vi.fn();
	const where = vi.fn();
	const innerJoin = vi.fn();
	const from = vi.fn();
	const select = vi.fn();

	limit.mockImplementation(() => {
		const call = selectCallCount;
		if (call === 1) return Promise.resolve([declarationLookupRow]);
		if (call === 4) {
			return Promise.resolve(declaration ? [declaration] : []);
		}
		if (call === 8 && txDraft !== null) {
			return Promise.resolve([{ draft: txDraft }]);
		}
		return Promise.resolve([]);
	});

	where.mockImplementation(() => {
		const call = selectCallCount;
		if (call === 2) {
			return Object.assign(
				Promise.resolve(emptyOpinionCountRow ? [] : [{ count: opinionCount }]),
				{ limit },
			);
		}
		if (call === 3) {
			return Object.assign(
				Promise.resolve(emptyFileCountRow ? [] : [{ count: fileCount }]),
				{ limit },
			);
		}
		if (call === 5) {
			return Object.assign(Promise.resolve(associations), { limit });
		}
		if (call === 6) {
			return Object.assign(Promise.resolve(opinions), { limit });
		}
		if (call === 7) {
			return Object.assign(Promise.resolve(categories), { limit });
		}
		return Object.assign(Promise.resolve([declarationLookupRow]), { limit });
	});

	innerJoin.mockReturnValue({ where });
	from.mockReturnValue({ where, innerJoin });
	select.mockImplementation(() => {
		selectCallCount++;
		return { from };
	});

	const updateWhere = vi.fn().mockResolvedValue(undefined);
	const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
	const update = vi.fn().mockReturnValue({ set: updateSet });

	const insertReturning = vi.fn().mockResolvedValue([]);
	const insertValues = vi.fn().mockReturnValue({ returning: insertReturning });
	const insert = vi.fn().mockReturnValue({ values: insertValues });

	const transaction = vi
		.fn()
		.mockImplementation(async (fn: (tx: unknown) => unknown) =>
			fn({ select, insert, update, delete: vi.fn() }),
		);

	return {
		db: {
			select,
			update,
			insert,
			transaction,
		} as unknown,
		updateSet,
		update,
		insertValues,
	};
}

function createCaller(
	mockDb: unknown,
	siret: string | null = "33978727700015",
	impersonation: { siren: string; name: string } | null = null,
) {
	return import("../cseOpinion").then(({ cseOpinionRouter }) =>
		cseOpinionRouter.createCaller({
			db: mockDb,
			session: {
				user: {
					id: "user-1",
					siret,
					isAdmin: impersonation !== null,
					impersonation,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never),
	);
}

describe("cseOpinionRouter.finalize", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("transitions awaiting_cse_opinion → demarche_completed and inserts cse_opinion_submit + demarche_complete events", async () => {
		const ctx = createMockDbForFinalize();
		const caller = await createCaller(ctx.db);

		const result = await caller.finalize();

		expect(result).toEqual({ success: true });
		expect(ctx.update).toHaveBeenCalled();
		expect(ctx.updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "demarche_completed",
				updatedAt: expect.any(Date),
			}),
		);
		const insertedEvents = ctx.insertValues.mock.calls[0]?.[0] as Array<{
			eventType: string;
		}>;
		expect(insertedEvents.map((e) => e.eventType)).toEqual([
			"cse_opinion_submit",
			"demarche_complete",
		]);
	});

	it("throws PRECONDITION_FAILED when no opinions exist", async () => {
		const ctx = createMockDbForFinalize({ opinionCount: 0 });
		const caller = await createCaller(ctx.db);

		await expect(caller.finalize()).rejects.toThrow(
			"Les avis du CSE doivent être renseignés avant validation.",
		);
		expect(ctx.update).not.toHaveBeenCalled();
	});

	it("throws PRECONDITION_FAILED when the opinion count query returns no row", async () => {
		const ctx = createMockDbForFinalize({ emptyOpinionCountRow: true });
		const caller = await createCaller(ctx.db);

		await expect(caller.finalize()).rejects.toThrow(
			"Les avis du CSE doivent être renseignés avant validation.",
		);
		expect(ctx.update).not.toHaveBeenCalled();
	});

	it("throws PRECONDITION_FAILED when the file count query returns no row", async () => {
		const ctx = createMockDbForFinalize({ emptyFileCountRow: true });
		const caller = await createCaller(ctx.db);

		await expect(caller.finalize()).rejects.toThrow(
			"Au moins un fichier d'avis CSE doit être transmis.",
		);
		expect(ctx.update).not.toHaveBeenCalled();
	});

	it("throws PRECONDITION_FAILED when no file has been uploaded", async () => {
		const ctx = createMockDbForFinalize({ fileCount: 0 });
		const caller = await createCaller(ctx.db);

		await expect(caller.finalize()).rejects.toThrow(
			"Au moins un fichier d'avis CSE doit être transmis.",
		);
		expect(ctx.update).not.toHaveBeenCalled();
	});

	it("throws NOT_FOUND when declaration row vanished between lookup and finalize", async () => {
		const ctx = createMockDbForFinalize({ declaration: null });
		const caller = await createCaller(ctx.db);

		await expect(caller.finalize()).rejects.toThrow("Déclaration introuvable");
	});

	it("refuses to finalize when the admin is impersonating", async () => {
		const ctx = createMockDbForFinalize();
		const caller = await createCaller(ctx.db, null, {
			siren: "339787277",
			name: "Acme",
		});

		await expect(caller.finalize()).rejects.toThrow("Mode mimoquage");
		expect(ctx.update).not.toHaveBeenCalled();
	});

	it("purges the cse draft slice and keeps other slices after finalize", async () => {
		const txDraft = { cse: { step1: { foo: "bar" } }, main: { step1: {} } };
		const ctx = createMockDbForFinalize({ txDraft });
		const caller = await createCaller(ctx.db);

		await caller.finalize();

		const setCalls = ctx.updateSet.mock.calls.map(
			(c) => c[0] as Record<string, unknown>,
		);
		const purgeCall = setCalls.find((c) => "draft" in c);
		expect(purgeCall).toBeDefined();
		expect(purgeCall?.draft).toEqual({ main: { step1: {} } });
		expect(purgeCall?.draftUpdatedAt).toBeInstanceOf(Date);
	});

	it("sets draft to null when cse was the only slice after finalize", async () => {
		const txDraft = { cse: { step1: { foo: "bar" } } };
		const ctx = createMockDbForFinalize({ txDraft });
		const caller = await createCaller(ctx.db);

		await caller.finalize();

		const setCalls = ctx.updateSet.mock.calls.map(
			(c) => c[0] as Record<string, unknown>,
		);
		const purgeCall = setCalls.find((c) => "draft" in c);
		expect(purgeCall).toBeDefined();
		expect(purgeCall?.draft).toBeNull();
		expect(purgeCall?.draftUpdatedAt).toBeNull();
	});

	it("does not call draft update when no draft exists in cse finalize", async () => {
		const ctx = createMockDbForFinalize({ txDraft: null });
		const caller = await createCaller(ctx.db);

		await caller.finalize();

		const setCalls = ctx.updateSet.mock.calls.map(
			(c) => c[0] as Record<string, unknown>,
		);
		const purgeCall = setCalls.find((c) => "draft" in c);
		expect(purgeCall).toBeUndefined();
	});

	describe("file-content-type association guard", () => {
		it("passes when only (1, accuracy) is required and it is covered", async () => {
			const ctx = createMockDbForFinalize({
				opinions: [{ declarationNumber: 1, type: "gap", gapConsulted: false }],
				associations: [{ declarationNumber: 1, type: "accuracy" }],
			});
			const caller = await createCaller(ctx.db);

			await expect(caller.finalize()).resolves.toEqual({ success: true });
		});

		it("throws PRECONDITION_FAILED when (1, accuracy) is not covered", async () => {
			const ctx = createMockDbForFinalize({
				opinions: [{ declarationNumber: 1, type: "gap", gapConsulted: false }],
				associations: [],
			});
			const caller = await createCaller(ctx.db);

			await expect(caller.finalize()).rejects.toThrow(
				"Le type de contenu « Exactitude » de la première déclaration doit être associé à un fichier avant validation.",
			);
			expect(ctx.update).not.toHaveBeenCalled();
		});

		it("requires (1, gap) when first declaration gapConsulted is true", async () => {
			const ctx = createMockDbForFinalize({
				opinions: [{ declarationNumber: 1, type: "gap", gapConsulted: true }],
				associations: [{ declarationNumber: 1, type: "accuracy" }],
			});
			const caller = await createCaller(ctx.db);

			await expect(caller.finalize()).rejects.toThrow(
				"Le type de contenu « Justification » de la première déclaration doit être associé à un fichier avant validation.",
			);
			expect(ctx.update).not.toHaveBeenCalled();
		});

		it("requires (2, accuracy) when a second declaration was submitted (its opinions exist)", async () => {
			const ctx = createMockDbForFinalize({
				opinions: [
					{ declarationNumber: 1, type: "gap", gapConsulted: false },
					{ declarationNumber: 2, type: "gap", gapConsulted: false },
				],
				associations: [{ declarationNumber: 1, type: "accuracy" }],
			});
			const caller = await createCaller(ctx.db);

			await expect(caller.finalize()).rejects.toThrow(
				"Le type de contenu « Exactitude » de la deuxième déclaration doit être associé à un fichier avant validation.",
			);
			expect(ctx.update).not.toHaveBeenCalled();
		});

		it("does not require a second-declaration association when correction was only started (secondDeclarationStep set, no second-declaration opinion)", async () => {
			// Regression guard (epic #3476): finalize keys off submitted second-
			// declaration opinions, like the Step 2 matrix — not secondDeclarationStep,
			// which is set as soon as correction data is saved. Relying on the column
			// would demand a (2, accuracy) association the matrix never offers.
			const ctx = createMockDbForFinalize({
				declaration: { ...DEFAULT_DECLARATION, secondDeclarationStep: 2 },
				opinions: [{ declarationNumber: 1, type: "gap", gapConsulted: false }],
				associations: [{ declarationNumber: 1, type: "accuracy" }],
			});
			const caller = await createCaller(ctx.db);

			await expect(caller.finalize()).resolves.toEqual({ success: true });
		});

		it("requires (2, gap) when second declaration gapConsulted is true", async () => {
			const ctx = createMockDbForFinalize({
				opinions: [
					{ declarationNumber: 1, type: "gap", gapConsulted: false },
					{ declarationNumber: 2, type: "gap", gapConsulted: true },
				],
				associations: [
					{ declarationNumber: 1, type: "accuracy" },
					{ declarationNumber: 2, type: "accuracy" },
				],
			});
			const caller = await createCaller(ctx.db);

			await expect(caller.finalize()).rejects.toThrow(
				"Le type de contenu « Justification » de la deuxième déclaration doit être associé à un fichier avant validation.",
			);
			expect(ctx.update).not.toHaveBeenCalled();
		});

		it("passes with a full two-declaration set when every required type is covered", async () => {
			const ctx = createMockDbForFinalize({
				opinions: [
					{ declarationNumber: 1, type: "gap", gapConsulted: true },
					{ declarationNumber: 2, type: "gap", gapConsulted: true },
				],
				associations: [
					{ declarationNumber: 1, type: "accuracy" },
					{ declarationNumber: 1, type: "gap" },
					{ declarationNumber: 2, type: "accuracy" },
					{ declarationNumber: 2, type: "gap" },
				],
			});
			const caller = await createCaller(ctx.db);

			await expect(caller.finalize()).resolves.toEqual({ success: true });
		});

		it("does not require (2, gap) when second declaration gapConsulted is false", async () => {
			const ctx = createMockDbForFinalize({
				opinions: [
					{ declarationNumber: 1, type: "gap", gapConsulted: false },
					{ declarationNumber: 2, type: "gap", gapConsulted: false },
				],
				associations: [
					{ declarationNumber: 1, type: "accuracy" },
					{ declarationNumber: 2, type: "accuracy" },
				],
			});
			const caller = await createCaller(ctx.db);

			await expect(caller.finalize()).resolves.toEqual({ success: true });
		});

		it("does not require (1, gap) when gapConsulted is true but there is no gap >= 5%", async () => {
			const ctx = createMockDbForFinalize({
				opinions: [{ declarationNumber: 1, type: "gap", gapConsulted: true }],
				associations: [{ declarationNumber: 1, type: "accuracy" }],
				categories: [],
			});
			const caller = await createCaller(ctx.db);

			await expect(caller.finalize()).resolves.toEqual({ success: true });
		});

		it("does not require (2, gap) when gapConsulted is true but there is no gap >= 5% on the second declaration", async () => {
			const ctx = createMockDbForFinalize({
				opinions: [
					{ declarationNumber: 1, type: "gap", gapConsulted: false },
					{ declarationNumber: 2, type: "gap", gapConsulted: true },
				],
				associations: [
					{ declarationNumber: 1, type: "accuracy" },
					{ declarationNumber: 2, type: "accuracy" },
				],
				categories: [gapCategory("initial")],
			});
			const caller = await createCaller(ctx.db);

			await expect(caller.finalize()).resolves.toEqual({ success: true });
		});
	});
});
