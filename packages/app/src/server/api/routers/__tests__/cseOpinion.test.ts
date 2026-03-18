import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const mockDeleteS3File = vi.fn();

vi.mock("~/server/services/s3", () => ({
	deleteFile: (...args: unknown[]) => mockDeleteS3File(...args),
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

function createMockDb(rows: unknown[] = []) {
	mockLimit.mockResolvedValue(rows);
	mockWhere.mockResolvedValue(rows);
	mockWhere.mockReturnValue(
		Object.assign(Promise.resolve(rows), { limit: mockLimit }),
	);
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
		delete: mockDelete,
		insert: mockInsert,
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
		mockDeleteS3File.mockResolvedValue(undefined);
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
				"SIRET manquant ou invalide dans la session",
			);
		});
	});

	describe("getFiles", () => {
		it("returns files for the current siren and year", async () => {
			const files = [
				{
					id: "file-1",
					fileName: "avis-cse.pdf",
					uploadedAt: new Date("2026-03-15"),
				},
			];
			const mockDb = createMockDb(files);
			const caller = await createCaller(mockDb);

			const result = await caller.getFiles();

			expect(mockSelect).toHaveBeenCalled();
			expect(result).toEqual({ files });
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

	describe("uploadFile", () => {
		const validInput = {
			fileName: "avis-cse.pdf",
			filePath: "339787277/2027/test-uuid.pdf",
		};

		it("saves file record to DB in a transaction", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			const result = await caller.uploadFile(validInput);

			expect(result).toEqual({ success: true });
			expect(mockTransaction).toHaveBeenCalled();
			expect(mockInsert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({
					siren: "339787277",
					fileName: "avis-cse.pdf",
					filePath: "339787277/2027/test-uuid.pdf",
					declarantId: "user-1",
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
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			await expect(
				caller.uploadFile({
					fileName: "",
					filePath: "339787277/2027/test-uuid.pdf",
				}),
			).rejects.toThrow();
		});

		it("rejects empty filePath", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			await expect(
				caller.uploadFile({ fileName: "test.pdf", filePath: "" }),
			).rejects.toThrow();
		});

		it("rejects non-PDF fileName", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			await expect(
				caller.uploadFile({
					fileName: "malicious.exe",
					filePath: "339787277/2027/test-uuid.pdf",
				}),
			).rejects.toThrow();
		});

		it("rejects invalid filePath format", async () => {
			const mockDb = createMockDb([]);
			const caller = await createCaller(mockDb);

			await expect(
				caller.uploadFile({
					fileName: "test.pdf",
					filePath: "invalid/path/with spaces.pdf",
				}),
			).rejects.toThrow();
		});

		it("throws when max files limit is reached", async () => {
			const fourFiles = Array.from({ length: 4 }, (_, i) => ({
				id: `file-${i}`,
			}));
			const mockDb = createMockDb(fourFiles);
			const caller = await createCaller(mockDb);

			await expect(caller.uploadFile(validInput)).rejects.toThrow(
				/Nombre maximum de fichiers/,
			);
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
});
