import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	env: { NEXT_PUBLIC_EGAPRO_ENV: "preprod" as "dev" | "preprod" | "prod" },
}));

vi.mock("~/server/auth", () => ({ auth: mocks.auth }));
vi.mock("~/env.js", () => ({ env: mocks.env }));

import { GET } from "../route";

const FRESH_MFA = Math.floor(Date.now() / 1000) - 60;
const EXPIRED_MFA = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;

function request(): Request {
	return new Request("https://egapro.test/api/test-sentry");
}

function signedIn(user: Record<string, unknown> | null) {
	mocks.auth.mockResolvedValue(user ? { user } : null);
}

describe("GET /api/test-sentry", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.env.NEXT_PUBLIC_EGAPRO_ENV = "preprod";
	});

	it.each([
		"dev",
		"preprod",
	] as const)("throws for an admin with a fresh second factor on %s", async (target) => {
		mocks.env.NEXT_PUBLIC_EGAPRO_ENV = target;
		signedIn({ id: "admin-1", isAdmin: true, adminMfaAt: FRESH_MFA });

		await expect(GET(request())).rejects.toThrow(/Sentry/);
	});

	it.each([
		["an anonymous caller", null],
		["a declarant", { id: "user-1", isAdmin: false }],
		["a session that predates the admin field", { id: "user-1" }],
		[
			"an admin who never presented a second factor",
			{ id: "admin-1", isAdmin: true },
		],
		[
			"an admin whose second factor expired",
			{ id: "admin-1", isAdmin: true, adminMfaAt: EXPIRED_MFA },
		],
	])("answers 404 to %s", async (_label, user) => {
		signedIn(user);

		const response = await GET(request());

		expect(response.status).toBe(404);
	});

	it("answers 404 in production, even to a fresh admin", async () => {
		mocks.env.NEXT_PUBLIC_EGAPRO_ENV = "prod";
		signedIn({ id: "admin-1", isAdmin: true, adminMfaAt: FRESH_MFA });

		const response = await GET(request());

		expect(response.status).toBe(404);
	});
});
