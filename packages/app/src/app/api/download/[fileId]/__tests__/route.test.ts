import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	fetchFileBySiren: vi.fn(),
	getFile: vi.fn(),
}));

vi.mock("~/server/auth", () => ({
	auth: mocks.auth,
}));

vi.mock("~/modules/export", () => ({
	fetchFileBySiren: mocks.fetchFileBySiren,
}));

vi.mock("~/server/services/s3", () => ({
	getFile: mocks.getFile,
	buildContentDisposition: (name: string, disposition: string) =>
		`${disposition}; filename="${name}"`,
}));

function mockSession(siret: string | null) {
	mocks.auth.mockResolvedValue(
		siret ? { user: { id: "user-1", siret } } : null,
	);
}

function makeParams(fileId: string) {
	return { params: Promise.resolve({ fileId }) };
}

import { GET } from "../route";

describe("GET /api/download/:fileId", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 when user is not authenticated", async () => {
		mocks.auth.mockResolvedValue(null);

		const request = new Request("http://localhost/api/download/file-1");
		const response = await GET(request, makeParams("file-1"));

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Non authentifié");
	});

	it("returns 401 when session has no siret", async () => {
		mocks.auth.mockResolvedValue({ user: { id: "user-1" } });

		const request = new Request("http://localhost/api/download/file-1");
		const response = await GET(request, makeParams("file-1"));

		expect(response.status).toBe(401);
	});

	it("returns 401 when siret is invalid", async () => {
		mockSession("123");

		const request = new Request("http://localhost/api/download/file-1");
		const response = await GET(request, makeParams("file-1"));

		expect(response.status).toBe(401);
	});

	it("returns 404 when file does not belong to user's SIREN", async () => {
		mockSession("12345678901234");
		mocks.fetchFileBySiren.mockResolvedValue(undefined);

		const request = new Request("http://localhost/api/download/file-1");
		const response = await GET(request, makeParams("file-1"));

		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body.error).toBe("Fichier non trouvé");
		expect(mocks.fetchFileBySiren).toHaveBeenCalledWith("file-1", "123456789");
	});

	it("streams file with inline Content-Disposition on success", async () => {
		mockSession("12345678901234");
		mocks.fetchFileBySiren.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse.pdf",
		});
		mocks.getFile.mockResolvedValue({
			body: new ReadableStream(),
			contentType: "application/pdf",
		});

		const request = new Request("http://localhost/api/download/file-1");
		const response = await GET(request, makeParams("file-1"));

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			'inline; filename="avis-cse.pdf"',
		);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
	});

	it("falls back to application/octet-stream for unexpected content types", async () => {
		mockSession("12345678901234");
		mocks.fetchFileBySiren.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "file.bin",
		});
		mocks.getFile.mockResolvedValue({
			body: new ReadableStream(),
			contentType: "text/html",
		});

		const request = new Request("http://localhost/api/download/file-1");
		const response = await GET(request, makeParams("file-1"));

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"application/octet-stream",
		);
	});

	it("returns 500 when S3 throws", async () => {
		mockSession("12345678901234");
		mocks.fetchFileBySiren.mockResolvedValue({
			filePath: "123456789/2027/abc.pdf",
			fileName: "avis-cse.pdf",
		});
		mocks.getFile.mockRejectedValue(new Error("S3 error"));

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const request = new Request("http://localhost/api/download/file-1");
		const response = await GET(request, makeParams("file-1"));

		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.error).toBe("Erreur lors de la récupération du fichier");
		consoleSpy.mockRestore();
	});
});
