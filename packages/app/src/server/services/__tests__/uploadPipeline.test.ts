import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	handleStreamingUpload: vi.fn(),
	deleteFile: vi.fn(),
	dbSelect: vi.fn(),
	dbTransaction: vi.fn(),
}));

vi.mock("../fileUpload", () => ({
	handleStreamingUpload: mocks.handleStreamingUpload,
}));

vi.mock("../s3", () => ({
	deleteFile: mocks.deleteFile,
}));

vi.mock("~/server/db", () => ({
	db: {
		select: mocks.dbSelect,
		transaction: mocks.dbTransaction,
	},
}));

vi.mock("~/server/db/schema", () => ({
	declarations: {
		id: "declarations.id",
		siren: "declarations.siren",
		year: "declarations.year",
	},
	files: {
		id: "files.id",
		declarationId: "files.declarationId",
		filePath: "files.filePath",
		fileName: "files.fileName",
		type: "files.type",
	},
}));

vi.mock("drizzle-orm", () => ({
	and: (...args: unknown[]) => ({ op: "and", args }),
	eq: (...args: unknown[]) => ({ op: "eq", args }),
	count: () => ({ op: "count" }),
}));

function createStream(): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new Uint8Array([1]));
			controller.close();
		},
	});
}

/**
 * Mocks the fluent select chain used by `findCurrentDeclaration` and
 * `countFilesByType`. Declaration look-up is called once (returns a single
 * row). CSE count is called zero or one time and returns a row `{ value: N }`.
 */
type Step =
	| { kind: "declaration"; id?: string }
	| { kind: "count"; value: number };

function primeDbSelect(steps: Step[]) {
	const queue = [...steps];
	mocks.dbSelect.mockImplementation(() => {
		const step = queue.shift();
		return {
			from: () => ({
				where: (..._args: unknown[]) => {
					// `count()` path is awaited directly from `.where()` (no `.limit()`)
					if (step?.kind === "count") {
						return Promise.resolve([{ value: step.value }]);
					}
					// Declaration lookup path chains `.limit(1)` before await.
					return {
						limit: () =>
							Promise.resolve(
								step?.kind === "declaration" && step.id !== undefined
									? [{ id: step.id }]
									: [],
							),
					};
				},
			}),
		};
	});
}

describe("runUploadPipeline", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const baseInput = {
		siren: "123456789",
		year: 2027,
		fileName: "avis-cse.pdf",
		contentType: "application/pdf",
		stream: createStream(),
	} as const;

	it("returns not_found when no declaration exists for siren/year", async () => {
		primeDbSelect([{ kind: "declaration", id: undefined }]);

		const { runUploadPipeline } = await import("../uploadPipeline");
		const result = await runUploadPipeline({
			...baseInput,
			stream: createStream(),
			flowType: "cse_opinion",
		});

		expect(result).toEqual({
			ok: false,
			reason: "not_found",
			error: expect.stringContaining("Déclaration introuvable"),
		});
		expect(mocks.handleStreamingUpload).not.toHaveBeenCalled();
	});

	it("rejects CSE upload with max_files BEFORE streaming when quota is reached", async () => {
		primeDbSelect([
			{ kind: "declaration", id: "decl-1" },
			{ kind: "count", value: 4 },
		]);

		const { runUploadPipeline } = await import("../uploadPipeline");
		const result = await runUploadPipeline({
			...baseInput,
			stream: createStream(),
			flowType: "cse_opinion",
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("max_files");
		}
		expect(mocks.handleStreamingUpload).not.toHaveBeenCalled();
	});

	it("propagates a virus verdict without attempting any DB write or S3 cleanup", async () => {
		primeDbSelect([
			{ kind: "declaration", id: "decl-1" },
			{ kind: "count", value: 0 },
		]);
		mocks.handleStreamingUpload.mockResolvedValue({
			ok: false,
			reason: "virus",
			error: "Fichier rejeté : virus détecté",
			virusName: "Eicar-Signature",
		});

		const { runUploadPipeline } = await import("../uploadPipeline");
		const result = await runUploadPipeline({
			...baseInput,
			stream: createStream(),
			flowType: "cse_opinion",
		});

		expect(result).toEqual({
			ok: false,
			reason: "virus",
			error: "Fichier rejeté : virus détecté",
			virusName: "Eicar-Signature",
		});
		expect(mocks.dbTransaction).not.toHaveBeenCalled();
		expect(mocks.deleteFile).not.toHaveBeenCalled();
	});

	it("propagates scan_unavailable without DB write or S3 cleanup", async () => {
		primeDbSelect([
			{ kind: "declaration", id: "decl-1" },
			{ kind: "count", value: 0 },
		]);
		mocks.handleStreamingUpload.mockResolvedValue({
			ok: false,
			reason: "scan_unavailable",
			error: "Antivirus indisponible",
		});

		const { runUploadPipeline } = await import("../uploadPipeline");
		const result = await runUploadPipeline({
			...baseInput,
			stream: createStream(),
			flowType: "joint_evaluation",
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("scan_unavailable");
		}
		expect(mocks.dbTransaction).not.toHaveBeenCalled();
		expect(mocks.deleteFile).not.toHaveBeenCalled();
	});

	it("commits a CSE file row on clean scan and does not touch S3 cleanup", async () => {
		primeDbSelect([
			{ kind: "declaration", id: "decl-1" },
			{ kind: "count", value: 0 },
		]);
		mocks.handleStreamingUpload.mockResolvedValue({
			ok: true,
			key: "123456789/2027/new-file.pdf",
			fileId: "new-file",
		});

		const insertValues = vi.fn().mockResolvedValue(undefined);
		const insert = vi.fn().mockReturnValue({ values: insertValues });
		// First tx.select() locks the declaration row via `.for("update").limit(1)`
		// Second tx.select() counts existing CSE files via `.where(...)` directly.
		let txSelectCallCount = 0;
		const txSelect = vi.fn().mockImplementation(() => {
			txSelectCallCount++;
			if (txSelectCallCount === 1) {
				return {
					from: () => ({
						where: () => ({
							for: () => ({ limit: () => Promise.resolve([{ id: "decl-1" }]) }),
						}),
					}),
				};
			}
			return {
				from: () => ({
					where: () => Promise.resolve([{ value: 0 }]),
				}),
			};
		});
		mocks.dbTransaction.mockImplementation(
			async (fn: (tx: unknown) => unknown) =>
				fn({ select: txSelect, insert, delete: vi.fn() }),
		);

		const { runUploadPipeline } = await import("../uploadPipeline");
		const result = await runUploadPipeline({
			...baseInput,
			stream: createStream(),
			flowType: "cse_opinion",
		});

		expect(result).toEqual({
			ok: true,
			fileId: "new-file",
			fileName: "avis-cse.pdf",
			filePath: "123456789/2027/new-file.pdf",
		});
		expect(insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "new-file",
				declarationId: "decl-1",
				fileName: "avis-cse.pdf",
				filePath: "123456789/2027/new-file.pdf",
				type: "cse_opinion",
			}),
		);
		expect(mocks.deleteFile).not.toHaveBeenCalled();
	});

	it("replaces an existing joint_evaluation file and best-effort deletes the old S3 object", async () => {
		primeDbSelect([{ kind: "declaration", id: "decl-1" }]);
		mocks.handleStreamingUpload.mockResolvedValue({
			ok: true,
			key: "123456789/2027/new-file.pdf",
			fileId: "new-file",
		});

		const insertValues = vi.fn().mockResolvedValue(undefined);
		const insert = vi.fn().mockReturnValue({ values: insertValues });
		const deleteWhere = vi.fn().mockResolvedValue(undefined);
		const del = vi.fn().mockReturnValue({ where: deleteWhere });
		const existingRow = [
			{ id: "old-file", filePath: "123456789/2027/old-file.pdf" },
		];
		// First tx.select() locks the declaration row via `.for("update").limit(1)`.
		// Second tx.select() looks up the existing joint_evaluation file.
		let txSelectCallCount = 0;
		const txSelect = vi.fn().mockImplementation(() => {
			txSelectCallCount++;
			if (txSelectCallCount === 1) {
				return {
					from: () => ({
						where: () => ({
							for: () => ({ limit: () => Promise.resolve([{ id: "decl-1" }]) }),
						}),
					}),
				};
			}
			return {
				from: () => ({
					where: () => ({
						limit: () => Promise.resolve(existingRow),
					}),
				}),
			};
		});
		mocks.dbTransaction.mockImplementation(
			async (fn: (tx: unknown) => unknown) =>
				fn({ select: txSelect, insert, delete: del }),
		);
		mocks.deleteFile.mockResolvedValue(undefined);

		const { runUploadPipeline } = await import("../uploadPipeline");
		const result = await runUploadPipeline({
			...baseInput,
			stream: createStream(),
			flowType: "joint_evaluation",
		});

		expect(result.ok).toBe(true);
		expect(del).toHaveBeenCalled();
		expect(insertValues).toHaveBeenCalledWith(
			expect.objectContaining({ type: "joint_evaluation" }),
		);
		// Wait a microtask so the fire-and-forget best-effort delete can run.
		await new Promise<void>((resolve) => setImmediate(resolve));
		expect(mocks.deleteFile).toHaveBeenCalledWith(
			"123456789/2027/old-file.pdf",
		);
	});

	it("compensates with deleteFile when DB insert fails after the S3 commit", async () => {
		primeDbSelect([
			{ kind: "declaration", id: "decl-1" },
			{ kind: "count", value: 0 },
		]);
		mocks.handleStreamingUpload.mockResolvedValue({
			ok: true,
			key: "123456789/2027/new-file.pdf",
			fileId: "new-file",
		});
		mocks.dbTransaction.mockRejectedValue(new Error("DB down"));
		mocks.deleteFile.mockResolvedValue(undefined);

		const { runUploadPipeline } = await import("../uploadPipeline");
		const result = await runUploadPipeline({
			...baseInput,
			stream: createStream(),
			flowType: "cse_opinion",
		});

		expect(result).toEqual({
			ok: false,
			reason: "server_error",
			error: "Erreur lors de l'enregistrement du fichier.",
			s3Cleanup: "ok",
		});
		expect(mocks.deleteFile).toHaveBeenCalledWith(
			"123456789/2027/new-file.pdf",
		);
	});

	it("reports s3Cleanup=failed when the compensating delete also fails", async () => {
		primeDbSelect([
			{ kind: "declaration", id: "decl-1" },
			{ kind: "count", value: 0 },
		]);
		mocks.handleStreamingUpload.mockResolvedValue({
			ok: true,
			key: "123456789/2027/new-file.pdf",
			fileId: "new-file",
		});
		mocks.dbTransaction.mockRejectedValue(new Error("DB down"));
		mocks.deleteFile.mockRejectedValue(new Error("S3 down"));

		vi.spyOn(console, "error").mockImplementation(() => {});

		const { runUploadPipeline } = await import("../uploadPipeline");
		const result = await runUploadPipeline({
			...baseInput,
			stream: createStream(),
			flowType: "cse_opinion",
		});

		expect(result).toEqual({
			ok: false,
			reason: "server_error",
			error: "Erreur lors de l'enregistrement du fichier.",
			s3Cleanup: "failed",
		});
	});
});
