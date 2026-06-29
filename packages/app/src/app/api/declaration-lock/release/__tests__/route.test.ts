import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	cachedAuth: vi.fn(),
	releaseLock: vi.fn(),
	limit: vi.fn(),
}));

vi.mock("~/server/audit/cachedAuth", () => ({
	cachedAuth: mocks.cachedAuth,
}));

vi.mock("~/server/audit/withAuditedRoute", () => ({
	withAuditedRoute: (
		_options: unknown,
		handler: (request: Request) => Promise<Response>,
	) => handler,
}));

vi.mock("~/server/services/declarationLockService", () => ({
	releaseLock: mocks.releaseLock,
}));

vi.mock("~/server/api/routers/declarationHelpers", () => ({
	activeDeclarationFilter: vi.fn(() => "filter"),
}));

vi.mock("~/server/db", () => ({
	db: {
		select: () => ({
			from: () => ({ where: () => ({ limit: mocks.limit }) }),
		}),
	},
}));

vi.mock("~/server/db/schema", () => ({
	declarations: { id: "id" },
}));

import { POST } from "../route";

const SIRET = "12345678901234";

function buildRequest() {
	return new Request("http://localhost/api/declaration-lock/release", {
		method: "POST",
	});
}

function mockSession(
	user: { id: string; siret?: string | null; impersonation?: unknown } | null,
) {
	mocks.cachedAuth.mockResolvedValue(user ? { user } : null);
}

function mockDeclaration(id: string | null) {
	mocks.limit.mockResolvedValue(id ? [{ id }] : []);
}

describe("POST /api/declaration-lock/release", () => {
	beforeEach(() => {
		mocks.cachedAuth.mockReset();
		mocks.releaseLock.mockReset();
		mocks.limit.mockReset();
	});

	it("returns 401 when there is no session", async () => {
		mockSession(null);

		const response = await POST(buildRequest());

		expect(response.status).toBe(401);
		expect(mocks.releaseLock).not.toHaveBeenCalled();
	});

	it("returns 204 without releasing when the caller is impersonating", async () => {
		mockSession({ id: "admin-1", siret: SIRET, impersonation: { siren: "9" } });

		const response = await POST(buildRequest());

		expect(response.status).toBe(204);
		expect(mocks.releaseLock).not.toHaveBeenCalled();
	});

	it("returns 400 when the session has no usable siren", async () => {
		mockSession({ id: "user-1", siret: null });

		const response = await POST(buildRequest());

		expect(response.status).toBe(400);
		expect(mocks.releaseLock).not.toHaveBeenCalled();
	});

	it("returns 204 without releasing when no current declaration is found", async () => {
		mockSession({ id: "user-1", siret: SIRET });
		mockDeclaration(null);

		const response = await POST(buildRequest());

		expect(response.status).toBe(204);
		expect(mocks.releaseLock).not.toHaveBeenCalled();
	});

	it("releases the resolved declaration lock for the caller and returns 204", async () => {
		mockSession({ id: "user-1", siret: SIRET });
		mockDeclaration("decl-1");

		const response = await POST(buildRequest());

		expect(response.status).toBe(204);
		expect(mocks.releaseLock).toHaveBeenCalledTimes(1);
		expect(mocks.releaseLock).toHaveBeenCalledWith(
			expect.anything(),
			"decl-1",
			"user-1",
		);
	});
});
