import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/server/db/schema", () => ({
	declarations: { id: "id", siren: "siren", year: "year" },
	jointEvaluationFiles: {
		id: "id",
		declarationId: "declarationId",
		fileName: "fileName",
		filePath: "filePath",
		uploadedAt: "uploadedAt",
	},
}));

const mockWhere = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockDelete = vi.fn();
const mockDeleteWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockLimit = vi.fn();
const mockTransaction = vi.fn();

// Track select call order: 1st = declaration lookup, 2nd+ = procedure queries
let selectCallCount = 0;

function createMockDb(rows: unknown[] = []) {
	selectCallCount = 0;

	// Declaration lookup: always returns a valid declaration
	const declarationResult = [{ id: "decl-1" }];

	mockLimit.mockImplementation(() => {
		return Promise.resolve(selectCallCount <= 1 ? declarationResult : rows);
	});
	mockWhere.mockReturnValue({ limit: mockLimit });
	mockFrom.mockReturnValue({ where: mockWhere });
	mockSelect.mockImplementation(() => {
		selectCallCount++;
		return { from: mockFrom };
	});

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
	return import("../jointEvaluation").then(({ jointEvaluationRouter }) =>
		jointEvaluationRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1", siret }, expires: "" },
			headers: new Headers(),
		} as never),
	);
}

describe("jointEvaluationRouter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("uploadFile", () => {
		const validInput = {
			fileName: "evaluation.pdf",
			filePath: "/uploads/evaluation.pdf",
		};

		it("deletes existing file and inserts new one in a transaction", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			const result = await caller.uploadFile(validInput);

			expect(result).toEqual({ success: true });
			expect(mockTransaction).toHaveBeenCalled();
			expect(mockDelete).toHaveBeenCalled();
			expect(mockInsert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({
					declarationId: "decl-1",
					fileName: "evaluation.pdf",
					filePath: "/uploads/evaluation.pdf",
				}),
			);
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.uploadFile(validInput)).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});

		it("rejects empty fileName", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			await expect(
				caller.uploadFile({ fileName: "", filePath: "/uploads/test.pdf" }),
			).rejects.toThrow();
		});

		it("rejects empty filePath", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb);

			await expect(
				caller.uploadFile({ fileName: "test.pdf", filePath: "" }),
			).rejects.toThrow();
		});
	});

	describe("getFile", () => {
		it("returns file when it exists", async () => {
			const file = {
				fileName: "evaluation.pdf",
				filePath: "/uploads/evaluation.pdf",
				uploadedAt: new Date("2026-01-15"),
			};
			const mockDb = createMockDb([file]);
			const caller = await createCaller(mockDb);

			const result = await caller.getFile();

			expect(result).toEqual(file);
			expect(mockSelect).toHaveBeenCalled();
		});

		it("returns null when no file exists", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			const result = await caller.getFile();

			expect(result).toBeNull();
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.getFile()).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
	});
});
