import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/server/db/schema", () => ({
	declarations: { id: "id", siren: "siren", year: "year" },
	declarationStatusHistory: {
		declarationId: "declarationId",
		eventType: "eventType",
		value: "value",
		createdAt: "createdAt",
	},
	files: {
		id: "id",
		declarationId: "declarationId",
		fileName: "fileName",
		filePath: "filePath",
		uploadedAt: "uploadedAt",
		type: "type",
	},
}));

const mockSelect = vi.fn();

// Reads in order: the middleware declaration lookup, the latest departure from
// the joint evaluation, then the report itself.
function createMockDb(rows: unknown[] = []) {
	const pending: unknown[][] = [[{ id: "decl-1" }], [{ at: null }], rows];
	const where = vi.fn().mockImplementation(() => {
		const result = Promise.resolve(pending.shift() ?? []);
		return Object.assign(result, { limit: vi.fn().mockReturnValue(result) });
	});
	mockSelect.mockReturnValue({ from: vi.fn().mockReturnValue({ where }) });

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
