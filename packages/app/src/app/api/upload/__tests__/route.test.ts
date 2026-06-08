import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	runUploadPipeline: vi.fn(),
	logAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/server/auth", () => ({
	auth: mocks.auth,
}));

vi.mock("~/server/services/uploadPipeline", () => ({
	runUploadPipeline: mocks.runUploadPipeline,
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

function validSession() {
	mocks.auth.mockResolvedValue({
		user: {
			id: "user-1",
			email: "user@example.com",
			siret: "12345678901234",
		},
	});
}

function pdfStream(): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
			controller.close();
		},
	});
}

function buildRequest(
	headers: Record<string, string>,
	body: BodyInit | null = pdfStream(),
): Request {
	// Node's `fetch` Request requires `duplex: "half"` when the body is a
	// ReadableStream. The option is standard but not in the DOM typings yet,
	// so we build the init object as a plain `Record` and cast at the edge.
	const init: Record<string, unknown> = {
		method: "POST",
		headers,
		body,
		duplex: "half",
	};
	return new Request("http://localhost/api/upload", init as RequestInit);
}

// HTTP header values are ByteStrings (Latin-1), so a non-Latin-1 filename
// (e.g. the U+202E RTL-override) cannot be set on a real `Request` header. A
// browser percent-decodes the value before the handler reads it, so in
// production the handler does receive the raw codepoint. We reproduce that by
// overriding `headers.get("x-filename")` while leaving every other header and
// the body intact, exercising the handler's branch with the exact input.
function buildRequestWithRawFilename(
	headers: Record<string, string>,
	rawFileName: string,
): Request {
	const request = buildRequest({ ...headers, "X-Filename": "placeholder.pdf" });
	const realGet = request.headers.get.bind(request.headers);
	request.headers.get = (name: string) =>
		name.toLowerCase() === "x-filename" ? rawFileName : realGet(name);
	return request;
}

describe("POST /api/upload", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 400 when X-Flow-Type is missing", async () => {
		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "f.pdf",
			}),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toContain("X-Flow-Type");
		expect(mocks.runUploadPipeline).not.toHaveBeenCalled();
	});

	it("returns 400 when X-Flow-Type is not a known value", async () => {
		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "f.pdf",
				"X-Flow-Type": "something_else",
			}),
		);

		expect(response.status).toBe(400);
	});

	it("returns 401 and writes an audit failure row when the session is missing", async () => {
		mocks.auth.mockResolvedValue(null);

		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "f.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(401);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "cse_opinion.upload_file",
				status: "failure",
				errorMessage: "HTTP 401",
			}),
		);
	});

	it("returns 403 and audits a failure row when the admin is impersonating", async () => {
		mocks.auth.mockResolvedValue({
			user: {
				id: "admin-1",
				email: "admin@example.com",
				siret: "12345678901234",
				isAdmin: true,
				impersonation: { siren: "987654321", name: "Acme" },
			},
		});

		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "f.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(403);
		const body = await response.json();
		expect(body.error).toContain("mimoquage");
		expect(mocks.runUploadPipeline).not.toHaveBeenCalled();
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "cse_opinion.upload_file",
				status: "failure",
				errorMessage: "HTTP 403 impersonation_read_only",
			}),
		);
	});

	it("returns 400 when X-Filename is missing", async () => {
		validSession();
		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(400);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "cse_opinion.upload_file",
				status: "failure",
				errorMessage: "HTTP 400 missing_filename",
			}),
		);
	});

	it("returns 400 when Content-Type is not in the whitelist", async () => {
		validSession();
		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "text/html",
				"X-Filename": "f.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(400);
		expect(mocks.runUploadPipeline).not.toHaveBeenCalled();
	});

	it("returns 400 invalid_filename when the name exceeds 200 characters", async () => {
		validSession();
		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": `${"a".repeat(197)}.pdf`,
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.reason).toBe("invalid_filename");
		expect(body.error).toContain("200");
		expect(mocks.runUploadPipeline).not.toHaveBeenCalled();
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "cse_opinion.upload_file",
				status: "failure",
				errorMessage: "HTTP 400 invalid_filename: too_long",
			}),
		);
	});

	it("returns 400 invalid_filename when the name contains a forbidden character", async () => {
		validSession();
		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "avis<cse.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.reason).toBe("invalid_filename");
		expect(mocks.runUploadPipeline).not.toHaveBeenCalled();
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "cse_opinion.upload_file",
				status: "failure",
				errorMessage: "HTTP 400 invalid_filename: forbidden_char",
			}),
		);
	});

	it("returns 400 invalid_filename when the name contains an invisible character", async () => {
		validSession();
		const { POST } = await import("../route");
		const response = await POST(
			buildRequestWithRawFilename(
				{
					"Content-Type": "application/pdf",
					"X-Flow-Type": "cse_opinion",
				},
				"avis‮cse.pdf",
			),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.reason).toBe("invalid_filename");
		expect(mocks.runUploadPipeline).not.toHaveBeenCalled();
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "cse_opinion.upload_file",
				status: "failure",
				errorMessage: "HTTP 400 invalid_filename: invisible_char",
			}),
		);
	});

	it("returns 400 invalid_filename when the extension does not match the declared MIME type", async () => {
		validSession();
		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "image/png",
				"X-Filename": "avis-cse.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.reason).toBe("invalid_filename");
		expect(mocks.runUploadPipeline).not.toHaveBeenCalled();
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "cse_opinion.upload_file",
				status: "failure",
				errorMessage: "HTTP 400 invalid_filename: extension_mime_mismatch",
			}),
		);
	});

	it("does not short-circuit a valid filename: the pipeline runs normally", async () => {
		validSession();
		mocks.runUploadPipeline.mockResolvedValue({
			ok: true,
			fileId: "file-uuid",
			fileName: "avis-cse.pdf",
			filePath: "123456789/2027/file-uuid.pdf",
		});

		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "avis-cse.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.reason).toBeUndefined();
		expect(mocks.runUploadPipeline).toHaveBeenCalledWith(
			expect.objectContaining({ fileName: "avis-cse.pdf" }),
		);
	});

	it("returns 200 with fileId + fileName on pipeline success and audits the success row", async () => {
		validSession();
		mocks.runUploadPipeline.mockResolvedValue({
			ok: true,
			fileId: "file-uuid",
			fileName: "avis-cse.pdf",
			filePath: "123456789/2027/file-uuid.pdf",
		});

		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "avis-cse.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ fileId: "file-uuid", fileName: "avis-cse.pdf" });
		expect(mocks.runUploadPipeline).toHaveBeenCalledWith(
			expect.objectContaining({
				siren: "123456789",
				flowType: "cse_opinion",
				fileName: "avis-cse.pdf",
				contentType: "application/pdf",
			}),
		);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "cse_opinion.upload_file",
				status: "success",
				siren: "123456789",
				userId: "user-1",
				userEmail: "user@example.com",
				metadata: expect.objectContaining({
					flowType: "cse_opinion",
					fileId: "file-uuid",
					fileName: "avis-cse.pdf",
				}),
			}),
		);
	});

	it("returns 422 with virus name on virus detection", async () => {
		validSession();
		mocks.runUploadPipeline.mockResolvedValue({
			ok: false,
			reason: "virus",
			error: "Fichier rejeté : virus détecté",
			virusName: "Eicar-Signature",
		});

		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "f.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(422);
		const body = await response.json();
		expect(body.virus).toBe("Eicar-Signature");
		expect(body.reason).toBe("virus");
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "cse_opinion.upload_file",
				status: "failure",
				errorMessage: "HTTP 422 virus_detected",
				metadata: expect.objectContaining({
					virusName: "Eicar-Signature",
				}),
			}),
		);
	});

	it("returns 503 when ClamAV is unavailable", async () => {
		validSession();
		mocks.runUploadPipeline.mockResolvedValue({
			ok: false,
			reason: "scan_unavailable",
			error: "Antivirus indisponible",
		});

		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "f.pdf",
				"X-Flow-Type": "joint_evaluation",
			}),
		);

		expect(response.status).toBe(503);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "joint_evaluation.upload_file",
				status: "failure",
				errorMessage: "HTTP 503 antivirus_unavailable",
			}),
		);
	});

	it("returns 400 when the CSE max files quota is reached", async () => {
		validSession();
		mocks.runUploadPipeline.mockResolvedValue({
			ok: false,
			reason: "max_files",
			error: "Vous avez atteint la limite de 4 fichiers.",
		});

		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "f.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(400);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				errorMessage: "HTTP 400 max_files",
			}),
		);
	});

	it("returns 403 when the declaration is not owned by the session SIREN", async () => {
		validSession();
		mocks.runUploadPipeline.mockResolvedValue({
			ok: false,
			reason: "not_found",
			error: "Déclaration introuvable pour l'année en cours.",
		});

		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "f.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(403);
	});

	it("returns 500 and logs the s3Cleanup status when the DB write fails after S3 commit", async () => {
		validSession();
		mocks.runUploadPipeline.mockResolvedValue({
			ok: false,
			reason: "server_error",
			error: "Erreur lors de l'enregistrement du fichier.",
			s3Cleanup: "ok",
		});

		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "f.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(500);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "cse_opinion.upload_file",
				status: "failure",
				errorMessage: "HTTP 500 server_error",
				metadata: expect.objectContaining({
					s3Cleanup: "ok",
				}),
			}),
		);
	});

	it("returns 500 with generic audit on an unexpected pipeline exception", async () => {
		validSession();
		mocks.runUploadPipeline.mockRejectedValue(new Error("boom"));
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const { POST } = await import("../route");
		const response = await POST(
			buildRequest({
				"Content-Type": "application/pdf",
				"X-Filename": "f.pdf",
				"X-Flow-Type": "cse_opinion",
			}),
		);

		expect(response.status).toBe(500);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "failure",
				errorMessage: "boom",
			}),
		);

		consoleSpy.mockRestore();
	});
});
