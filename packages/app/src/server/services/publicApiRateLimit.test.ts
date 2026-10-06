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
		headers: { "x-real-ip": "203.0.113.8", ...headers },
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

	it("ignores a spoofed forwarded-for value when the ingress IP is present", async () => {
		const { enforcePublicApiRateLimit } = await import("./publicApiRateLimit");

		for (let index = 0; index < 120; index += 1) {
			expect(
				await enforcePublicApiRateLimit(
					request({ "x-forwarded-for": `198.51.100.${index}` }),
				),
			).toBeNull();
		}

		expect(
			await enforcePublicApiRateLimit(
				request({ "x-forwarded-for": "198.51.100.250" }),
			),
		).toMatchObject({ status: 429 });
	});
});

describe("checkPublicApiRateLimit", () => {
	function headers(init: HeadersInit = {}) {
		return new Headers({ "x-real-ip": "203.0.113.9", ...init });
	}

	it("allows a call within the anonymous quota", async () => {
		const { checkPublicApiRateLimit } = await import("./publicApiRateLimit");

		expect(await checkPublicApiRateLimit(headers())).toBe("allowed");
	});

	it("reports an unknown bearer token as invalid", async () => {
		mocks.env.EGAPRO_PUBLIC_API_TOKENS = "known-token";
		const { checkPublicApiRateLimit } = await import("./publicApiRateLimit");

		expect(
			await checkPublicApiRateLimit(
				headers({ Authorization: "Bearer unknown-token" }),
			),
		).toBe("invalid_token");
	});

	it("reports the 121st anonymous call of the minute as limited", async () => {
		const { checkPublicApiRateLimit } = await import("./publicApiRateLimit");

		for (let index = 0; index < 120; index += 1) {
			expect(await checkPublicApiRateLimit(headers())).toBe("allowed");
		}

		expect(await checkPublicApiRateLimit(headers())).toBe("limited");
	});

	it("shares one quota between the REST check and the headers check", async () => {
		const { checkPublicApiRateLimit, enforcePublicApiRateLimit } = await import(
			"./publicApiRateLimit"
		);

		for (let index = 0; index < 120; index += 1) {
			expect(
				await enforcePublicApiRateLimit(
					request({ "x-real-ip": "203.0.113.9" }),
				),
			).toBeNull();
		}

		expect(await checkPublicApiRateLimit(headers())).toBe("limited");
	});
});
