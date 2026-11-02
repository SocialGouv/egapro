import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	handleStreamingUpload: vi.fn(),
	deleteFile: vi.fn(),
	dbSelect: vi.fn(),
	dbTransaction: vi.fn(),
	getRequiredContentTypes: vi.fn(),
	isFormalNoticeAvailableFor: vi.fn(),
}));

vi.mock("../fileUpload", () => ({
	handleStreamingUpload: mocks.handleStreamingUpload,
}));

vi.mock("../cseRequiredContentTypes", () => ({
	getRequiredContentTypes: mocks.getRequiredContentTypes,
}));

vi.mock("../formalNoticeExposure", () => ({
	isFormalNoticeAvailableFor: mocks.isFormalNoticeAvailableFor,
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
	desc: (column: unknown) => ({ op: "desc", column }),
	isNull: (column: unknown) => ({ op: "isNull", column }),
	ne: (...args: unknown[]) => ({ op: "ne", args }),
	sql: (...args: unknown[]) => ({ op: "sql", args }),
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
					// Declaration lookup path chains `.orderBy().limit(1)` before
					// await. `.limit()` is deliberately unreachable without
					// `.orderBy()`: an unordered lookup here would resolve a
					// different row than the lock guard, and must break loudly.
					const rows =
						step?.kind === "declaration" && step.id !== undefined
							? [{ id: step.id }]
							: [];
					return {
						orderBy: () => ({ limit: () => Promise.resolve(rows) }),
					};
				},
			}),
		};
	});
}

describe("runUploadPipeline", () => {
	beforeEach(() => {
		// Four required content types: the quota then matches MAX_CSE_FILES,
		// which is what most cases here exercise.
		mocks.getRequiredContentTypes.mockReturnValue([
			{ declarationNumber: 1, type: "accuracy" },
			{ declarationNumber: 1, type: "gap" },
			{ declarationNumber: 2, type: "accuracy" },
			{ declarationNumber: 2, type: "gap" },
		]);
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

	it("caps the CSE quota at the number of required content types (#4299)", async () => {
		mocks.getRequiredContentTypes.mockReturnValue([
			{ declarationNumber: 1, type: "accuracy" },
			{ declarationNumber: 2, type: "accuracy" },
		]);
		primeDbSelect([
			{ kind: "declaration", id: "decl-1" },
			{ kind: "count", value: 2 },
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
			expect(result.error).toContain("limite de 2 fichiers");
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
		const updateSet = vi
			.fn()
			.mockReturnValue({ where: () => Promise.resolve() });
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
				fn({
					execute: vi.fn().mockResolvedValue(undefined),
					select: txSelect,
					insert,
					delete: vi.fn(),
					update: () => ({ set: updateSet }),
				}),
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
		expect(updateSet).toHaveBeenCalledWith({
			cseOpinionDraftUpdatedAt: expect.any(Date),
		});
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

	it("classifies the concurrent CSE quota race as max_files and compensates the S3 commit", async () => {
		// Pre-check passes (currentCount = 3 < MAX_CSE_FILES = 4) so we enter the
		// streaming path and the pipeline commits the S3 multipart. Inside the
		// tx, a concurrent upload has meanwhile pushed the count to 4, so the
		// in-tx recount throws MaxFilesReachedError. Since the S3 object has
		// already been committed, the compensating delete must run, and the
		// caller must still see the actionable quota message (not a generic
		// server_error) so the client maps it to HTTP 400, not 500.
		primeDbSelect([
			{ kind: "declaration", id: "decl-1" },
			{ kind: "count", value: 3 },
		]);
		mocks.handleStreamingUpload.mockResolvedValue({
			ok: true,
			key: "123456789/2027/new-file.pdf",
			fileId: "new-file",
		});

		const insertValues = vi.fn().mockResolvedValue(undefined);
		const insert = vi.fn().mockReturnValue({ values: insertValues });
		let txSelectCallCount = 0;
		const txSelect = vi.fn().mockImplementation(() => {
			txSelectCallCount++;
			if (txSelectCallCount === 1) {
				// Declaration lock
				return {
					from: () => ({
						where: () => ({
							for: () => ({
								limit: () => Promise.resolve([{ id: "decl-1" }]),
							}),
						}),
					}),
				};
			}
			// In-tx CSE recount — race has now pushed it to MAX_CSE_FILES.
			return {
				from: () => ({
					where: () => Promise.resolve([{ value: 4 }]),
				}),
			};
		});
		mocks.dbTransaction.mockImplementation(
			async (fn: (tx: unknown) => unknown) =>
				fn({
					execute: vi.fn().mockResolvedValue(undefined),
					select: txSelect,
					insert,
					delete: vi.fn(),
				}),
		);
		mocks.deleteFile.mockResolvedValue(undefined);

		vi.spyOn(console, "error").mockImplementation(() => {});

		const { runUploadPipeline } = await import("../uploadPipeline");
		const result = await runUploadPipeline({
			...baseInput,
			stream: createStream(),
			flowType: "cse_opinion",
		});

		expect(result).toEqual({
			ok: false,
			reason: "max_files",
			error:
				"Vous avez atteint la limite de 4 fichiers. Supprimez-en un avant d'en ajouter un nouveau.",
			s3Cleanup: "ok",
		});
		// No row inserted because the in-tx recount threw before the insert.
		expect(insertValues).not.toHaveBeenCalled();
		// Compensating delete of the just-committed S3 object.
		expect(mocks.deleteFile).toHaveBeenCalledWith(
			"123456789/2027/new-file.pdf",
		);
	});

	it("re-reads the quota inside the transaction when the required types shrink (#4299)", async () => {
		// Pre-check sees four required content types (quota 4) and two files, so
		// the upload streams. Meanwhile the declaration loses two required types
		// — the in-tx quota is now 2 and the same two files fill it.
		mocks.getRequiredContentTypes
			.mockReturnValueOnce([
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 1, type: "gap" },
				{ declarationNumber: 2, type: "accuracy" },
				{ declarationNumber: 2, type: "gap" },
			])
			.mockReturnValue([
				{ declarationNumber: 1, type: "accuracy" },
				{ declarationNumber: 2, type: "accuracy" },
			]);
		primeDbSelect([
			{ kind: "declaration", id: "decl-1" },
			{ kind: "count", value: 2 },
		]);
		mocks.handleStreamingUpload.mockResolvedValue({
			ok: true,
			key: "123456789/2027/new-file.pdf",
			fileId: "new-file",
		});

		const insertValues = vi.fn().mockResolvedValue(undefined);
		const insert = vi.fn().mockReturnValue({ values: insertValues });
		let txSelectCallCount = 0;
		const txSelect = vi.fn().mockImplementation(() => {
			txSelectCallCount++;
			if (txSelectCallCount === 1) {
				return {
					from: () => ({
						where: () => ({
							for: () => ({
								limit: () => Promise.resolve([{ id: "decl-1" }]),
							}),
						}),
					}),
				};
			}
			return {
				from: () => ({
					where: () => Promise.resolve([{ value: 2 }]),
				}),
			};
		});
		mocks.dbTransaction.mockImplementation(
			async (fn: (tx: unknown) => unknown) =>
				fn({
					execute: vi.fn().mockResolvedValue(undefined),
					select: txSelect,
					insert,
					delete: vi.fn(),
				}),
		);
		mocks.deleteFile.mockResolvedValue(undefined);

		vi.spyOn(console, "error").mockImplementation(() => {});

		const { runUploadPipeline } = await import("../uploadPipeline");
		const result = await runUploadPipeline({
			...baseInput,
			stream: createStream(),
			flowType: "cse_opinion",
		});

		expect(result.ok).toBe(false);
		expect(insertValues).not.toHaveBeenCalled();
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

	describe("formal_notice_joint_evaluation flow", () => {
		function primeReplacementTransaction(existingRow: unknown[]) {
			const insertValues = vi.fn().mockResolvedValue(undefined);
			const insert = vi.fn().mockReturnValue({ values: insertValues });
			const deleteWhere = vi.fn().mockResolvedValue(undefined);
			const del = vi.fn().mockReturnValue({ where: deleteWhere });
			const existingFileWhere = vi.fn().mockReturnValue({
				limit: () => Promise.resolve(existingRow),
			});
			let txSelectCallCount = 0;
			const txSelect = vi.fn().mockImplementation(() => {
				txSelectCallCount++;
				if (txSelectCallCount === 1) {
					return {
						from: () => ({
							where: () => ({
								for: () => ({
									limit: () => Promise.resolve([{ id: "decl-1" }]),
								}),
							}),
						}),
					};
				}
				return { from: () => ({ where: existingFileWhere }) };
			});
			mocks.dbTransaction.mockImplementation(
				async (fn: (tx: unknown) => unknown) =>
					fn({ select: txSelect, insert, delete: del }),
			);
			return { insertValues, del, deleteWhere, existingFileWhere, txSelect };
		}

		const formalNoticeInput = {
			...baseInput,
			fileName: "evaluation-mise-en-demeure.pdf",
			flowType: "formal_notice_joint_evaluation",
		} as const;

		it("refuses the upload before streaming when the démarche is not exposed", async () => {
			primeDbSelect([{ kind: "declaration", id: "decl-1" }]);
			mocks.isFormalNoticeAvailableFor.mockResolvedValue(false);

			const { runUploadPipeline } = await import("../uploadPipeline");
			const result = await runUploadPipeline({
				...formalNoticeInput,
				stream: createStream(),
			});

			expect(result).toEqual({
				ok: false,
				reason: "formal_notice_unavailable",
				error:
					"Le dépôt du rapport de l'évaluation conjointe suite à une mise en demeure n'est pas ouvert pour cette démarche.",
			});
			expect(mocks.isFormalNoticeAvailableFor).toHaveBeenCalledWith(
				expect.anything(),
				"decl-1",
			);
			expect(mocks.handleStreamingUpload).not.toHaveBeenCalled();
			expect(mocks.dbTransaction).not.toHaveBeenCalled();
			expect(mocks.deleteFile).not.toHaveBeenCalled();
		});

		it("returns not_found before checking the exposure when no declaration exists", async () => {
			primeDbSelect([{ kind: "declaration", id: undefined }]);

			const { runUploadPipeline } = await import("../uploadPipeline");
			const result = await runUploadPipeline({
				...formalNoticeInput,
				stream: createStream(),
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.reason).toBe("not_found");
			}
			expect(mocks.isFormalNoticeAvailableFor).not.toHaveBeenCalled();
		});

		it("replaces the previous report of the same type without entering the CSE quota", async () => {
			primeDbSelect([{ kind: "declaration", id: "decl-1" }]);
			mocks.isFormalNoticeAvailableFor.mockResolvedValue(true);
			mocks.handleStreamingUpload.mockResolvedValue({
				ok: true,
				key: "123456789/2027/new-file.pdf",
				fileId: "new-file",
			});
			mocks.deleteFile.mockResolvedValue(undefined);
			const { insertValues, del, existingFileWhere } =
				primeReplacementTransaction([
					{ id: "old-file", filePath: "123456789/2027/old-file.pdf" },
				]);

			const { runUploadPipeline } = await import("../uploadPipeline");
			const result = await runUploadPipeline({
				...formalNoticeInput,
				stream: createStream(),
			});

			expect(result).toEqual({
				ok: true,
				fileId: "new-file",
				fileName: "evaluation-mise-en-demeure.pdf",
				filePath: "123456789/2027/new-file.pdf",
			});
			expect(existingFileWhere).toHaveBeenCalledWith({
				op: "and",
				args: [
					{ op: "eq", args: ["files.declarationId", "decl-1"] },
					{
						op: "eq",
						args: ["files.type", "formal_notice_joint_evaluation"],
					},
				],
			});
			expect(del).toHaveBeenCalled();
			expect(insertValues).toHaveBeenCalledWith({
				id: "new-file",
				declarationId: "decl-1",
				fileName: "evaluation-mise-en-demeure.pdf",
				filePath: "123456789/2027/new-file.pdf",
				type: "formal_notice_joint_evaluation",
			});
			expect(mocks.getRequiredContentTypes).not.toHaveBeenCalled();
			await vi.waitFor(() =>
				expect(mocks.deleteFile).toHaveBeenCalledWith(
					"123456789/2027/old-file.pdf",
				),
			);
		});

		it("inserts the first report without deleting anything", async () => {
			primeDbSelect([{ kind: "declaration", id: "decl-1" }]);
			mocks.isFormalNoticeAvailableFor.mockResolvedValue(true);
			mocks.handleStreamingUpload.mockResolvedValue({
				ok: true,
				key: "123456789/2027/new-file.pdf",
				fileId: "new-file",
			});
			const { insertValues, del } = primeReplacementTransaction([]);

			const { runUploadPipeline } = await import("../uploadPipeline");
			const result = await runUploadPipeline({
				...formalNoticeInput,
				stream: createStream(),
			});

			expect(result.ok).toBe(true);
			expect(del).not.toHaveBeenCalled();
			expect(insertValues).toHaveBeenCalledWith(
				expect.objectContaining({ type: "formal_notice_joint_evaluation" }),
			);
			expect(mocks.deleteFile).not.toHaveBeenCalled();
		});

		it("never checks the formal notice exposure for the other flows", async () => {
			primeDbSelect([{ kind: "declaration", id: "decl-1" }]);
			mocks.handleStreamingUpload.mockResolvedValue({
				ok: false,
				reason: "scan_unavailable",
				error: "Antivirus indisponible",
			});

			const { runUploadPipeline } = await import("../uploadPipeline");
			await runUploadPipeline({
				...baseInput,
				stream: createStream(),
				flowType: "joint_evaluation",
			});

			expect(mocks.isFormalNoticeAvailableFor).not.toHaveBeenCalled();
		});
	});
});
