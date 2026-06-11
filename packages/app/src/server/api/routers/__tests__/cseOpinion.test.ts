import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/server/db/schema", () => ({
	declarations: { id: "id", siren: "siren", year: "year" },
	cseOpinions: {
		id: "id",
		declarationId: "declarationId",
		declarationNumber: "declarationNumber",
		type: "type",
		opinion: "opinion",
		opinionDate: "opinionDate",
		gapConsulted: "gapConsulted",
	},
	files: {
		id: "id",
		declarationId: "declarationId",
		fileName: "fileName",
		filePath: "filePath",
		uploadedAt: "uploadedAt",
		type: "type",
	},
	cseOpinionFiles: {
		id: "id",
		declarationId: "declarationId",
		declarationNumber: "declarationNumber",
		type: "type",
		fileId: "fileId",
	},
}));

const mockDeleteS3File = vi.fn();
const mockGetFileSize = vi.fn();

vi.mock("~/server/services/s3", () => ({
	deleteFile: (...args: unknown[]) => mockDeleteS3File(...args),
	getFileSize: (...args: unknown[]) => mockGetFileSize(...args),
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
		// If this is the declaration lookup (first select chain), return declaration
		// Otherwise return the test-specific rows
		return Promise.resolve(selectCallCount <= 1 ? declarationResult : rows);
	});
	mockWhere.mockImplementation(() => {
		const result = selectCallCount <= 1 ? declarationResult : rows;
		return Object.assign(Promise.resolve(result), { limit: mockLimit });
	});
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
		delete: mockDelete,
		insert: mockInsert,
		transaction: mockTransaction,
	} as unknown;
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

describe("cseOpinionRouter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockDeleteS3File.mockResolvedValue(undefined);
		mockGetFileSize.mockResolvedValue(null);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("get", () => {
		it("returns opinions for the current declaration", async () => {
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
				"SIRET manquant ou invalide dans la session",
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
						declarationId: "decl-1",
						declarationNumber: 1,
						type: "accuracy",
						opinion: "favorable",
					}),
					expect.objectContaining({
						declarationId: "decl-1",
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
				"SIRET manquant ou invalide dans la session",
			);
		});
	});

	describe("getFiles", () => {
		it("returns files for the current declaration with their storage size", async () => {
			const uploadedAt = new Date("2026-03-15");
			const rows = [
				{
					id: "file-1",
					fileName: "avis-cse.pdf",
					filePath: "339787277/2026/file-1.pdf",
					uploadedAt,
				},
			];
			mockGetFileSize.mockResolvedValue(63365);
			const mockDb = createMockDb(rows);
			const caller = await createCaller(mockDb);

			const result = await caller.getFiles();

			expect(mockSelect).toHaveBeenCalled();
			expect(mockGetFileSize).toHaveBeenCalledWith("339787277/2026/file-1.pdf");
			expect(result).toEqual({
				files: [
					{
						id: "file-1",
						fileName: "avis-cse.pdf",
						uploadedAt,
						fileSize: 63365,
					},
				],
			});
		});

		it("returns empty files when none exist", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			const result = await caller.getFiles();

			expect(result).toEqual({ files: [] });
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.getFiles()).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
	});

	describe("getFileContentTypes", () => {
		it("returns associations for the current declaration", async () => {
			const associations = [
				{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
				{ declarationNumber: 1, type: "gap", fileId: "file-1" },
			];
			const mockDb = createMockDb(associations);
			const caller = await createCaller(mockDb);

			const result = await caller.getFileContentTypes();

			expect(mockSelect).toHaveBeenCalled();
			expect(result).toEqual({ associations });
		});

		it("returns empty associations when none exist", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			const result = await caller.getFileContentTypes();

			expect(result).toEqual({ associations: [] });
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.getFileContentTypes()).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
	});

	describe("setFileContentTypes", () => {
		it("replaces associations transactionally after validating files", async () => {
			const mockDb = createMockDb([{ id: "file-1" }]);
			const caller = await createCaller(mockDb);

			const result = await caller.setFileContentTypes({
				associations: [
					{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
					{ declarationNumber: 1, type: "gap", fileId: "file-1" },
				],
			});

			expect(result).toEqual({ success: true });
			expect(mockTransaction).toHaveBeenCalled();
			expect(mockDelete).toHaveBeenCalled();
			expect(mockInsert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalledWith([
				expect.objectContaining({
					declarationId: "decl-1",
					declarationNumber: 1,
					type: "accuracy",
					fileId: "file-1",
				}),
				expect.objectContaining({
					declarationId: "decl-1",
					declarationNumber: 1,
					type: "gap",
					fileId: "file-1",
				}),
			]);
		});

		it("allows one file to be associated with several types", async () => {
			const mockDb = createMockDb([{ id: "file-1" }]);
			const caller = await createCaller(mockDb);

			const result = await caller.setFileContentTypes({
				associations: [
					{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
					{ declarationNumber: 2, type: "gap", fileId: "file-1" },
				],
			});

			expect(result).toEqual({ success: true });
			expect(mockValues).toHaveBeenCalledWith([
				expect.objectContaining({ type: "accuracy", fileId: "file-1" }),
				expect.objectContaining({ type: "gap", fileId: "file-1" }),
			]);
		});

		it("throws BAD_REQUEST when the same (declarationNumber, type) is duplicated", async () => {
			const mockDb = createMockDb([{ id: "file-1" }]);
			const caller = await createCaller(mockDb);

			await expect(
				caller.setFileContentTypes({
					associations: [
						{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
						{ declarationNumber: 1, type: "accuracy", fileId: "file-2" },
					],
				}),
			).rejects.toThrow(
				"Chaque couple (numéro de déclaration, type) ne peut être associé qu'à un seul fichier.",
			);
			expect(mockTransaction).not.toHaveBeenCalled();
		});

		it("throws BAD_REQUEST when a fileId does not belong to the declaration", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			await expect(
				caller.setFileContentTypes({
					associations: [
						{ declarationNumber: 1, type: "accuracy", fileId: "ghost" },
					],
				}),
			).rejects.toThrow(
				"Un ou plusieurs fichiers sont introuvables ou invalides pour cette déclaration.",
			);
			expect(mockTransaction).not.toHaveBeenCalled();
		});

		it("clears associations and skips validation when input is empty", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			const result = await caller.setFileContentTypes({ associations: [] });

			expect(result).toEqual({ success: true });
			expect(mockTransaction).toHaveBeenCalled();
			expect(mockDelete).toHaveBeenCalled();
			expect(mockInsert).not.toHaveBeenCalled();
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb([{ id: "file-1" }]);
			const caller = await createCaller(mockDb, null as never);

			await expect(
				caller.setFileContentTypes({
					associations: [
						{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
					],
				}),
			).rejects.toThrow("SIRET manquant ou invalide dans la session");
		});

		it("refuses setFileContentTypes when the admin is impersonating", async () => {
			const mockDb = createMockDb([{ id: "file-1" }]);
			const caller = await createCaller(mockDb, null, {
				siren: "339787277",
				name: "Acme",
			});

			await expect(
				caller.setFileContentTypes({
					associations: [
						{ declarationNumber: 1, type: "accuracy", fileId: "file-1" },
					],
				}),
			).rejects.toThrow("Mode mimoquage");
			expect(mockTransaction).not.toHaveBeenCalled();
		});
	});

	describe("deleteFile", () => {
		it("deletes file from S3 and DB", async () => {
			const mockDb = createMockDb([{ filePath: "339787277/2027/file-1.pdf" }]);
			const caller = await createCaller(mockDb);

			const result = await caller.deleteFile({ fileId: "file-1" });

			expect(result).toEqual({ success: true });
			expect(mockDeleteS3File).toHaveBeenCalledWith(
				"339787277/2027/file-1.pdf",
			);
			expect(mockDelete).toHaveBeenCalled();
		});

		it("throws when file is not found", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			await expect(
				caller.deleteFile({ fileId: "nonexistent" }),
			).rejects.toThrow("Fichier introuvable.");
			expect(mockDeleteS3File).not.toHaveBeenCalled();
		});

		it("throws when siret is missing", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null as never);

			await expect(caller.deleteFile({ fileId: "file-1" })).rejects.toThrow(
				"SIRET manquant ou invalide dans la session",
			);
		});
	});

	describe("admin impersonation read-only guard", () => {
		const impersonation = { siren: "339787277", name: "Acme" };
		const validInput = {
			firstDeclaration: {
				accuracyOpinion: "favorable" as const,
				accuracyDate: "2026-01-15",
				gapConsulted: true,
				gapOpinion: "unfavorable" as const,
				gapDate: "2026-01-16",
			},
		};

		it("refuses saveOpinions when the admin is impersonating", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null, impersonation);

			await expect(caller.saveOpinions(validInput)).rejects.toThrow(
				"Mode mimoquage",
			);
		});

		it("refuses deleteFile when the admin is impersonating", async () => {
			const mockDb = createMockDb();
			const caller = await createCaller(mockDb, null, impersonation);

			await expect(caller.deleteFile({ fileId: "file-1" })).rejects.toThrow(
				"Mode mimoquage",
			);
			expect(mockDeleteS3File).not.toHaveBeenCalled();
		});
	});
});
