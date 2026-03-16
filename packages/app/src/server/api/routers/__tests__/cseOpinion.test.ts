import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const mockWhere = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockDelete = vi.fn();
const mockDeleteWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockTransaction = vi.fn();

function createMockDb(rows: unknown[] = []) {
	mockWhere.mockResolvedValue(rows);
	mockFrom.mockReturnValue({ where: mockWhere });
	mockSelect.mockReturnValue({ from: mockFrom });

	mockDeleteWhere.mockResolvedValue(undefined);
	mockDelete.mockReturnValue({ where: mockDeleteWhere });

	mockValues.mockResolvedValue(undefined);
	mockInsert.mockReturnValue({ values: mockValues });

	mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
		fn({
			select: mockSelect,
			delete: mockDelete,
			insert: mockInsert,
		}),
	);

	return {
		select: mockSelect,
		transaction: mockTransaction,
	} as unknown;
}

function createCaller(mockDb: unknown, siret = "33978727700015") {
	return import("../cseOpinion").then(({ cseOpinionRouter }) =>
		cseOpinionRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1", siret }, expires: "" },
			headers: new Headers(),
		} as never),
	);
}

describe("cseOpinionRouter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("get", () => {
		it("returns opinions for the current siren and year", async () => {
			const opinions = [
				{
					declarationNumber: 1,
					type: "accuracy",
					opinion: "favorable",
					opinionDate: "2026-01-15",
					gapConsulted: null,
				},
			];
			const mockDb = createMockDb(opinions);
			const caller = await createCaller(mockDb);

			const result = await caller.get();

			expect(mockSelect).toHaveBeenCalled();
			expect(result).toEqual({ opinions });
		});

		it("returns empty opinions when none exist", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			const result = await caller.get();

			expect(result).toEqual({ opinions: [] });
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.get()).rejects.toThrow(
				"SIRET manquant dans la session",
			);
		});
	});

	describe("saveOpinions", () => {
		const validInput = {
			firstDeclaration: {
				accuracyOpinion: "favorable" as const,
				accuracyDate: "2026-01-15",
				gapConsulted: true,
				gapOpinion: "unfavorable" as const,
				gapDate: "2026-01-16",
			},
		};

		it("deletes existing opinions and inserts new ones in a transaction", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.saveOpinions(validInput);

			expect(result).toEqual({ success: true });
			expect(mockTransaction).toHaveBeenCalled();
			expect(mockDelete).toHaveBeenCalled();
			expect(mockInsert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						siren: "339787277",
						declarationNumber: 1,
						type: "accuracy",
						opinion: "favorable",
					}),
					expect.objectContaining({
						siren: "339787277",
						declarationNumber: 1,
						type: "gap",
						gapConsulted: true,
						opinion: "unfavorable",
					}),
				]),
			);
		});

		it("inserts second declaration opinions when provided", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const inputWithSecond = {
				...validInput,
				secondDeclaration: {
					accuracyOpinion: "unfavorable" as const,
					accuracyDate: "2026-02-01",
					gapConsulted: false,
					gapOpinion: null,
					gapDate: null,
				},
			};

			const result = await caller.saveOpinions(inputWithSecond);

			expect(result).toEqual({ success: true });
			expect(mockValues).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						declarationNumber: 2,
						type: "accuracy",
						opinion: "unfavorable",
					}),
					expect.objectContaining({
						declarationNumber: 2,
						type: "gap",
						gapConsulted: false,
					}),
				]),
			);
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.saveOpinions(validInput)).rejects.toThrow(
				"SIRET manquant dans la session",
			);
		});
	});
});
