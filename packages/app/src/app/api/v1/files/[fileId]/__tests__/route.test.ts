import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	logAction: vi.fn().mockResolvedValue(undefined),
	fetchFileById: vi.fn(),
	fetchFileBySiren: vi.fn(),
	streamStoredFile: vi.fn(),
	isGatewayForwarded: vi.fn(),
}));

vi.mock("~/server/auth", () => ({ auth: mocks.auth }));

vi.mock("~/server/audit/log", () => ({ logAction: mocks.logAction }));

vi.mock("~/modules/export", () => ({
	fetchFileById: mocks.fetchFileById,
	fetchFileBySiren: mocks.fetchFileBySiren,
}));

vi.mock("~/server/services/fileStreaming", () => ({
	streamStoredFile: mocks.streamStoredFile,
}));

vi.mock("~/server/services/gatewaySource", () => ({
	isGatewayForwarded: mocks.isGatewayForwarded,
}));

import { AUDIT_ACTIONS } from "~/modules/audit";
import { GET } from "../route";

const FILE_ID = "file-1";
const SIREN = "123456789";
const SIRET = `${SIREN}00015`;
const IMPERSONATED_SIREN = "987654321";
const STORED_FILE = { filePath: "s3://bucket/f.pdf", fileName: "avis-cse.pdf" };

function request() {
	return new Request(`https://egapro.test/api/v1/files/${FILE_ID}`);
}

function params() {
	return { params: Promise.resolve({ fileId: FILE_ID }) };
}

function signedIn(user: Record<string, unknown>) {
	mocks.auth.mockResolvedValue({ user });
}

function auditRow(): Record<string, unknown> {
	return (mocks.logAction.mock.calls[0]?.[0] ?? {}) as Record<string, unknown>;
}

describe("GET /api/v1/files/:fileId", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.isGatewayForwarded.mockReturnValue(false);
		mocks.streamStoredFile.mockResolvedValue(new Response("pdf bytes"));
		mocks.fetchFileById.mockResolvedValue(STORED_FILE);
		mocks.fetchFileBySiren.mockResolvedValue(STORED_FILE);
		signedIn({ id: "user-1", email: "declarant@exemple.fr", siret: SIRET });
	});

	it("streams the file scoped to the session siren for a regular user", async () => {
		const response = await GET(request(), params());

		expect(response.status).toBe(200);
		expect(mocks.fetchFileBySiren).toHaveBeenCalledWith(FILE_ID, SIREN);
		expect(mocks.fetchFileById).not.toHaveBeenCalled();
		expect(auditRow()).toMatchObject({
			action: AUDIT_ACTIONS.USER_FILE_DOWNLOAD,
			status: "success",
			siren: SIREN,
		});
	});

	it("answers 404 when the file does not belong to the session siren", async () => {
		mocks.fetchFileBySiren.mockResolvedValue(null);

		const response = await GET(request(), params());

		expect(response.status).toBe(404);
		expect(mocks.streamStoredFile).not.toHaveBeenCalled();
	});

	it.each([
		["no session at all", null],
		[
			"a session whose siret is malformed",
			{ user: { id: "user-1", siret: "1234A678900015" } },
		],
		[
			"a session whose siret is too short",
			{ user: { id: "user-1", siret: "1234" } },
		],
		["a session without a siret", { user: { id: "user-1" } }],
	])("refuses the download with %s", async (_label, session) => {
		mocks.auth.mockResolvedValue(session);

		const response = await GET(request(), params());

		expect(response.status).toBe(401);
		expect(mocks.fetchFileBySiren).not.toHaveBeenCalled();
		expect(mocks.fetchFileById).not.toHaveBeenCalled();
	});

	it("keeps the unscoped admin branch for an admin, even in mimoquage", async () => {
		signedIn({
			id: "admin-1",
			email: "admin@exemple.fr",
			siret: "99999999900011",
			isAdmin: true,
			impersonation: { siren: IMPERSONATED_SIREN },
		});

		const response = await GET(request(), params());

		expect(response.status).toBe(200);
		expect(mocks.fetchFileById).toHaveBeenCalledWith(FILE_ID);
		expect(mocks.fetchFileBySiren).not.toHaveBeenCalled();
		expect(auditRow()).toMatchObject({
			action: AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD,
			status: "success",
		});
	});

	it("serves the gateway caller without touching the session", async () => {
		mocks.isGatewayForwarded.mockReturnValue(true);

		const response = await GET(request(), params());

		expect(response.status).toBe(200);
		expect(mocks.fetchFileById).toHaveBeenCalledWith(FILE_ID);
		expect(mocks.auth).not.toHaveBeenCalled();
		expect(auditRow()).toMatchObject({
			action: AUDIT_ACTIONS.EXPORT_API_FILES,
			status: "success",
		});
	});
});
