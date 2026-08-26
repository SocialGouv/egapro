import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	env: {
		EGAPRO_PUBLIC_API_TOKENS: "",
		VALKEY_URL: "",
	},
}));

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({ env: mocks.env }));
vi.mock("redis", () => ({ createClient: vi.fn() }));

function request(headers: HeadersInit = {}) {
	return new Request("http://localhost/api/public/declarations", {
		headers: { "x-forwarded-for": "203.0.113.8", ...headers },
	});
}

beforeEach(() => {
	vi.resetModules();
	mocks.env.EGAPRO_PUBLIC_API_TOKENS = "";
	mocks.env.VALKEY_URL = "";
});

describe("enforcePublicApiRateLimit", () => {
	it("rejects an unknown bearer token", async () => {
		mocks.env.EGAPRO_PUBLIC_API_TOKENS = "known-token";
		const { enforcePublicApiRateLimit } = await import("./publicApiRateLimit");

		const response = await enforcePublicApiRateLimit(
			request({ Authorization: "Bearer unknown-token" }),
		);

		expect(response?.status).toBe(401);
		expect(response?.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});

	it("allows 120 anonymous calls per minute then returns 429", async () => {
		const { enforcePublicApiRateLimit } = await import("./publicApiRateLimit");

		for (let index = 0; index < 120; index += 1) {
			expect(await enforcePublicApiRateLimit(request())).toBeNull();
		}
		const response = await enforcePublicApiRateLimit(request());

		expect(response?.status).toBe(429);
		expect(response?.headers.get("Retry-After")).toBe("60");
	});
});
