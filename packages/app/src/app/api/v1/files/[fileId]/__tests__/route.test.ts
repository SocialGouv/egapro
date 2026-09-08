import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	fetchFileById: vi.fn(),
	fetchFileBySiren: vi.fn(),
	streamStoredFile: vi.fn(),
	logAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/server/auth", () => ({
	auth: mocks.auth,
}));

vi.mock("~/modules/export", () => ({
	fetchFileById: mocks.fetchFileById,
	fetchFileBySiren: mocks.fetchFileBySiren,
}));

vi.mock("~/server/services/fileStreaming", () => ({
	streamStoredFile: mocks.streamStoredFile,
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

import { GET } from "../route";

// A SIRET whose first 9 digits form the admin's own SIREN scope.
const ADMIN_SIRET = "98765432100010";
const ADMIN_SIREN = "987654321";
// A file belonging to a company the admin is not a referent of.
const OTHER_SIREN_FILE = {
	filePath: "123456789/2027/f.pdf",
	fileName: "f.pdf",
};
const OWN_SIREN_FILE = { filePath: "987654321/2027/f.pdf", fileName: "f.pdf" };

const HOUR = 60 * 60;

function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

function buildRequest(headers: Record<string, string> = {}): Request {
	return new Request("http://localhost/api/v1/files/file-1", { headers });
}

function callGet(request: Request) {
	return GET(request, { params: Promise.resolve({ fileId: "file-1" }) });
}

function mockStream(body = "content") {
	mocks.streamStoredFile.mockResolvedValue(
		new Response(body, { headers: { "Content-Type": "application/pdf" } }),
	);
}

describe("GET /api/v1/files/:fileId", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockStream();
	});

	describe("gateway-forwarded caller (SUIT)", () => {
		function gatewayRequest() {
			return buildRequest({ "X-Gateway-Forwarded": "secret" });
		}

		it("serves the file by id without consulting the session, regardless of caller", async () => {
			mocks.fetchFileById.mockResolvedValue(OTHER_SIREN_FILE);

			const response = await callGet(gatewayRequest());

			expect(response.status).toBe(200);
			expect(mocks.auth).not.toHaveBeenCalled();
			expect(mocks.fetchFileById).toHaveBeenCalledWith("file-1");
			expect(mocks.streamStoredFile).toHaveBeenCalledWith(
				expect.objectContaining({ disposition: "attachment" }),
			);
			expect(mocks.logAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "export.api_files",
					status: "success",
				}),
			);
		});

		it("returns 404 and audits a failure when the file does not exist", async () => {
			mocks.fetchFileById.mockResolvedValue(undefined);

			const response = await callGet(gatewayRequest());

			expect(response.status).toBe(404);
			expect(mocks.logAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "export.api_files",
					status: "failure",
				}),
			);
		});

		it("empty X-Gateway-Forwarded header falls through to the session branch", async () => {
			mocks.auth.mockResolvedValue(null);

			const response = await callGet(
				buildRequest({ "X-Gateway-Forwarded": "" }),
			);

			expect(response.status).toBe(401);
			expect(mocks.auth).toHaveBeenCalled();
		});
	});

	describe("no session", () => {
		it("returns 401 and audits a failure", async () => {
			mocks.auth.mockResolvedValue(null);

			const response = await callGet(buildRequest());

			expect(response.status).toBe(401);
			expect(mocks.logAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "user.file_download",
					status: "failure",
					errorMessage: "HTTP 401",
				}),
			);
		});
	});

	describe("regular user session (unchanged)", () => {
		it("serves a file within the caller's own SIREN scope, inline", async () => {
			mocks.auth.mockResolvedValue({
				user: { id: "user-1", email: "user@example.com", siret: ADMIN_SIRET },
			});
			mocks.fetchFileBySiren.mockResolvedValue(OWN_SIREN_FILE);

			const response = await callGet(buildRequest());

			expect(response.status).toBe(200);
			expect(mocks.fetchFileBySiren).toHaveBeenCalledWith(
				"file-1",
				ADMIN_SIREN,
			);
			expect(mocks.streamStoredFile).toHaveBeenCalledWith(
				expect.objectContaining({ disposition: "inline" }),
			);
			expect(mocks.logAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "user.file_download",
					status: "success",
					siren: ADMIN_SIREN,
				}),
			);
		});

		it("returns the generic 404 for a file outside the caller's scope, without mentioning MFA", async () => {
			mocks.auth.mockResolvedValue({
				user: { id: "user-1", email: "user@example.com", siret: ADMIN_SIRET },
			});
			mocks.fetchFileBySiren.mockResolvedValue(undefined);

			const response = await callGet(buildRequest());

			expect(response.status).toBe(404);
			const body = await response.json();
			expect(body.error).toBe("Fichier non trouvé");
			expect(body.error).not.toMatch(/authentification/i);
			expect(mocks.logAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "user.file_download",
					status: "failure",
					errorMessage: "HTTP 404",
				}),
			);
		});

		it("returns 401 when the session carries no usable SIREN", async () => {
			mocks.auth.mockResolvedValue({
				user: { id: "user-1", email: "user@example.com", siret: null },
			});

			const response = await callGet(buildRequest());

			expect(response.status).toBe(401);
			expect(mocks.fetchFileBySiren).not.toHaveBeenCalled();
		});
	});

	describe("admin session with a fresh double authentication", () => {
		function freshAdminSession(overrides: Record<string, unknown> = {}) {
			mocks.auth.mockResolvedValue({
				user: {
					id: "admin-1",
					email: "admin@example.com",
					siret: ADMIN_SIRET,
					isAdmin: true,
					adminMfaAt: nowSeconds() - 60,
					...overrides,
				},
			});
		}

		it("bypasses SIREN scope and serves any file as an attachment", async () => {
			freshAdminSession();
			mocks.fetchFileById.mockResolvedValue(OTHER_SIREN_FILE);

			const response = await callGet(buildRequest());

			expect(response.status).toBe(200);
			expect(mocks.fetchFileById).toHaveBeenCalledWith("file-1");
			expect(mocks.fetchFileBySiren).not.toHaveBeenCalled();
			expect(mocks.streamStoredFile).toHaveBeenCalledWith(
				expect.objectContaining({ disposition: "attachment" }),
			);
			expect(mocks.logAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "admin.file_download",
					status: "success",
				}),
			);
		});

		it("returns the unchanged 404 when the file does not exist", async () => {
			freshAdminSession();
			mocks.fetchFileById.mockResolvedValue(undefined);

			const response = await callGet(buildRequest());

			expect(response.status).toBe(404);
			expect(mocks.logAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "admin.file_download",
					status: "failure",
					errorMessage: "HTTP 404",
				}),
			);
		});
	});

	describe("admin session with an expired double authentication", () => {
		function expiredAdminSession(overrides: Record<string, unknown> = {}) {
			mocks.auth.mockResolvedValue({
				user: {
					id: "admin-1",
					email: "admin@example.com",
					siret: ADMIN_SIRET,
					isAdmin: true,
					adminMfaAt: nowSeconds() - 9 * HOUR,
					...overrides,
				},
			});
		}

		it("serves a file within the admin's own SIREN scope, like a regular user", async () => {
			expiredAdminSession();
			mocks.fetchFileBySiren.mockResolvedValue(OWN_SIREN_FILE);

			const response = await callGet(buildRequest());

			expect(response.status).toBe(200);
			expect(mocks.fetchFileBySiren).toHaveBeenCalledWith(
				"file-1",
				ADMIN_SIREN,
			);
			expect(mocks.fetchFileById).not.toHaveBeenCalled();
			expect(mocks.streamStoredFile).toHaveBeenCalledWith(
				expect.objectContaining({ disposition: "inline" }),
			);
			expect(mocks.logAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "user.file_download",
					status: "success",
					siren: ADMIN_SIREN,
				}),
			);
		});

		it("refuses a file outside the admin's own SIREN scope, naming the expired double authentication", async () => {
			expiredAdminSession();
			mocks.fetchFileBySiren.mockResolvedValue(undefined);

			const response = await callGet(buildRequest());

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error).toMatch(/double authentification/i);
			expect(mocks.streamStoredFile).not.toHaveBeenCalled();
			expect(mocks.logAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "admin.file_download",
					status: "failure",
					errorMessage: "HTTP 403 admin_mfa_expired",
					siren: ADMIN_SIREN,
				}),
			);
		});

		it("refuses explicitly when the admin has no usable SIREN of their own", async () => {
			expiredAdminSession({ siret: null });

			const response = await callGet(buildRequest());

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error).toMatch(/double authentification/i);
			expect(mocks.fetchFileBySiren).not.toHaveBeenCalled();
			expect(mocks.logAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "admin.file_download",
					status: "failure",
					errorMessage: "HTTP 403 admin_mfa_expired",
					siren: null,
				}),
			);
		});

		it("treats a session that never completed the double authentication the same as expired", async () => {
			mocks.auth.mockResolvedValue({
				user: {
					id: "admin-1",
					email: "admin@example.com",
					siret: ADMIN_SIRET,
					isAdmin: true,
					adminMfaAt: null,
				},
			});
			mocks.fetchFileBySiren.mockResolvedValue(undefined);

			const response = await callGet(buildRequest());

			expect(response.status).toBe(403);
			expect(mocks.fetchFileById).not.toHaveBeenCalled();
		});
	});
});
