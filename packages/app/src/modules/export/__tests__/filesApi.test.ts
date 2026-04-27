import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchCseFiles = vi.fn().mockResolvedValue(new Map());
const mockFetchJointFiles = vi.fn().mockResolvedValue(new Map());
const mockFetchFileById = vi.fn().mockResolvedValue(undefined);
const mockFetchFileBySiren = vi.fn().mockResolvedValue(undefined);
const mockAuth = vi.fn().mockResolvedValue(null);
const mockLogAction = vi.fn().mockResolvedValue(undefined);

vi.mock("~/modules/export/queries", () => ({
	fetchCseFilesByDeclaration: (...args: unknown[]) =>
		mockFetchCseFiles(...args),
	fetchJointEvaluationFilesByDeclaration: (...args: unknown[]) =>
		mockFetchJointFiles(...args),
	fetchFileById: (...args: unknown[]) => mockFetchFileById(...args),
	fetchFileBySiren: (...args: unknown[]) => mockFetchFileBySiren(...args),
	fetchSubmittedDeclarations: vi.fn().mockResolvedValue([]),
	fetchIndicatorGByDeclaration: vi.fn().mockResolvedValue(new Map()),
	fetchCseOpinionsByDeclaration: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock("~/server/auth", () => ({
	auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("~/server/audit/log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

vi.mock("~/server/services/s3", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/server/services/s3")>();
	return {
		...actual,
		getFile: vi.fn().mockResolvedValue({
			body: new ReadableStream(),
			contentType: "application/pdf",
		}),
	};
});

/**
 * APISIX-forwarded requests carry `X-Gateway-Forwarded` (injected by the
 * gateway's `proxy-rewrite` plugin). Bearer + rate-limit are enforced by
 * APISIX upstream, so tests only need to simulate the header presence
 * that the middleware has already validated. The unified `[fileId]`
 * handler routes on this header to dispatch to the SUIT branch.
 */
function gatewayForwardedRequest(url: string): Request {
	return new Request(url, {
		headers: { "x-gateway-forwarded": "test-gateway-secret" },
	});
}

function mockSession(siret: string | null) {
	mockAuth.mockResolvedValue(
		siret ? { user: { id: "user-1", email: "test@example.com", siret } } : null,
	);
}

describe("GET /api/v1/files", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchCseFiles.mockResolvedValue(new Map());
		mockFetchJointFiles.mockResolvedValue(new Map());
	});

	it("should return 403 when X-Gateway-Forwarded header is missing", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = new Request(
			"http://localhost/api/v1/files?siren=123456789&year=2027",
		);
		const response = await GET(request);

		expect(response.status).toBe(403);
	});

	it("should return 400 when siren is missing", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files?year=2027",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toContain("siren");
	});

	it("should return 400 when siren format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files?siren=123&year=2027",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
	});

	it("should return 400 when year is missing", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files?siren=123456789",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
	});

	it("should return 400 when year is outside the allowed range", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files?siren=123456789&year=0000",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
	});

	it("should return empty files array when no files exist", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files?siren=123456789&year=2027",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.siren).toBe("123456789");
		expect(body.year).toBe(2027);
		expect(body.files).toEqual([]);
	});

	it("should return CSE and joint evaluation files with correct types", async () => {
		mockFetchCseFiles.mockResolvedValue(
			new Map([
				[
					"123456789-2027",
					[
						{
							id: "cse-1",
							siren: "123456789",
							year: 2027,
							fileName: "avis-cse.pdf",
							filePath: "123456789/2027/abc.pdf",
							uploadedAt: new Date("2027-03-10T08:00:00Z"),
						},
					],
				],
			]),
		);
		mockFetchJointFiles.mockResolvedValue(
			new Map([
				[
					"123456789-2027",
					[
						{
							id: "joint-1",
							siren: "123456789",
							year: 2027,
							fileName: "evaluation.pdf",
							filePath: "123456789/2027/def.pdf",
							uploadedAt: new Date("2027-03-12T09:00:00Z"),
						},
					],
				],
			]),
		);

		const { GET } = await import("~/app/api/v1/files/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files?siren=123456789&year=2027",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.files).toHaveLength(2);
		expect(body.files[0]).toEqual({
			id: "cse-1",
			type: "cse_opinion",
			fileName: "avis-cse.pdf",
			uploadedAt: "2027-03-10T08:00:00.000Z",
			downloadUrl: "/api/v1/files/cse-1",
		});
		expect(body.files[1]).toEqual({
			id: "joint-1",
			type: "joint_evaluation",
			fileName: "evaluation.pdf",
			uploadedAt: "2027-03-12T09:00:00.000Z",
			downloadUrl: "/api/v1/files/joint-1",
		});
	});

	it("should call queries with correct siren and year", async () => {
		const { GET } = await import("~/app/api/v1/files/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files?siren=987654321&year=2026",
		);
		await GET(request);

		const expectedKey = [{ siren: "987654321", year: 2026 }];
		expect(mockFetchCseFiles).toHaveBeenCalledWith(expectedKey);
		expect(mockFetchJointFiles).toHaveBeenCalledWith(expectedKey);
	});
});

describe("GET /api/v1/files/:fileId — SUIT branch (gateway-forwarded)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchFileById.mockResolvedValue(undefined);
	});

	it("should return 404 when file does not exist", async () => {
		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files/nonexistent",
		);
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "nonexistent" }),
		});

		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body.error).toContain("non trouvé");
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "export.api_files",
				status: "failure",
				errorMessage: "HTTP 404",
			}),
		);
	});

	it("should stream file as attachment when file exists", async () => {
		mockFetchFileById.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse-evaluation.pdf",
		});

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files/file-1",
		);
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			`attachment; filename="avis-cse-evaluation.pdf"; filename*=UTF-8''avis-cse-evaluation.pdf`,
		);
		expect(response.headers.get("Cache-Control")).toBe("private, max-age=3600");
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "export.api_files",
				status: "success",
				metadata: { fileId: "file-1", fileName: "avis-cse-evaluation.pdf" },
			}),
		);
	});

	it("should provide an ASCII fallback and UTF-8 filename for non-ASCII names", async () => {
		mockFetchFileById.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse-évaluation.pdf",
		});

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files/file-1",
		);
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Disposition")).toBe(
			`attachment; filename="avis-cse-_valuation.pdf"; filename*=UTF-8''avis-cse-%C3%A9valuation.pdf`,
		);
	});

	it("should return 500 when S3 throws", async () => {
		mockFetchFileById.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse.pdf",
		});

		const { getFile } = await import("~/server/services/s3");
		vi.mocked(getFile).mockRejectedValueOnce(new Error("S3 error"));

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/files/file-1",
		);
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(500);
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "export.api_files",
				status: "failure",
				errorMessage: "S3 error",
			}),
		);

		consoleSpy.mockRestore();
	});
});

describe("GET /api/v1/files/:fileId — session branch (in-app user)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchFileBySiren.mockResolvedValue(undefined);
	});

	it("returns 401 when no session is present", async () => {
		mockSession(null);

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = new Request("http://localhost/api/v1/files/file-1");
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Non authentifié");
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "user.file_download",
				status: "failure",
				errorMessage: "HTTP 401",
			}),
		);
	});

	it("returns 401 when session has no SIRET", async () => {
		mockAuth.mockResolvedValue({
			user: { id: "user-1", email: "test@example.com" },
		});

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = new Request("http://localhost/api/v1/files/file-1");
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(401);
	});

	it("returns 401 when SIRET is malformed", async () => {
		mockSession("123");

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = new Request("http://localhost/api/v1/files/file-1");
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(401);
	});

	it("returns 404 when file does not belong to user's SIREN", async () => {
		mockSession("12345678901234");
		mockFetchFileBySiren.mockResolvedValue(undefined);

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = new Request("http://localhost/api/v1/files/file-1");
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(404);
		expect(mockFetchFileBySiren).toHaveBeenCalledWith("file-1", "123456789");
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "user.file_download",
				status: "failure",
				errorMessage: "HTTP 404",
				siren: "123456789",
				userId: "user-1",
				userEmail: "test@example.com",
			}),
		);
	});

	it("streams file inline on success and writes a sensitive-read audit row", async () => {
		mockSession("12345678901234");
		mockFetchFileBySiren.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse.pdf",
		});

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = new Request("http://localhost/api/v1/files/file-1");
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			`inline; filename="avis-cse.pdf"; filename*=UTF-8''avis-cse.pdf`,
		);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "user.file_download",
				status: "success",
				userId: "user-1",
				userEmail: "test@example.com",
				siren: "123456789",
				metadata: { fileId: "file-1", fileName: "avis-cse.pdf" },
			}),
		);
	});

	it("falls back to application/octet-stream for unexpected content types", async () => {
		mockSession("12345678901234");
		mockFetchFileBySiren.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "file.bin",
		});

		const { getFile } = await import("~/server/services/s3");
		vi.mocked(getFile).mockResolvedValueOnce({
			body: new ReadableStream(),
			contentType: "text/html",
		});

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = new Request("http://localhost/api/v1/files/file-1");
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"application/octet-stream",
		);
	});

	it("returns 500 when S3 throws", async () => {
		mockSession("12345678901234");
		mockFetchFileBySiren.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse.pdf",
		});

		const { getFile } = await import("~/server/services/s3");
		vi.mocked(getFile).mockRejectedValueOnce(new Error("S3 error"));

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const { GET } = await import("~/app/api/v1/files/[fileId]/route");
		const request = new Request("http://localhost/api/v1/files/file-1");
		const response = await GET(request, {
			params: Promise.resolve({ fileId: "file-1" }),
		});

		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.error).toBe("Erreur lors de la récupération du fichier");
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "user.file_download",
				status: "failure",
				errorMessage: "S3 error",
			}),
		);

		consoleSpy.mockRestore();
	});
});
