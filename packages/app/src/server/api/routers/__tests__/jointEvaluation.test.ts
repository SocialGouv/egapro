import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/server/db/schema", () => ({
	declarations: { id: "id", siren: "siren", year: "year" },
	files: {
		id: "id",
		declarationId: "declarationId",
		fileName: "fileName",
		filePath: "filePath",
		uploadedAt: "uploadedAt",
		type: "type",
	},
}));

const mockWhere = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockLimit = vi.fn();

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

	return {
		select: mockSelect,
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
