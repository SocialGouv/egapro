import { afterEach, describe, expect, it, vi } from "vitest";

import { assertBearerToken } from "../bearerToken";

const TOKEN_NAME = "EGAPRO_TEST_API_TOKEN";

function request(headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/test", { method: "POST", headers });
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("assertBearerToken", () => {
	it("refuses with 401 and logs when the expected token is not configured", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const response = assertBearerToken(
			request({ authorization: "Bearer anything" }),
			{ expectedToken: undefined, tokenName: TOKEN_NAME },
		);

		expect(response?.status).toBe(401);
		await expect(response?.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(TOKEN_NAME));
	});

	it("refuses an empty expected token, even against an empty bearer", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});

		const response = assertBearerToken(request({ authorization: "Bearer " }), {
			expectedToken: "",
			tokenName: TOKEN_NAME,
		});

		expect(response?.status).toBe(401);
	});

	it("refuses a request without an authorization header", () => {
		const response = assertBearerToken(request(), {
			expectedToken: "expected-token",
			tokenName: TOKEN_NAME,
		});

		expect(response?.status).toBe(401);
	});

	it.each([
		["a wrong token", "Bearer wrong-token"],
		["a token prefix", "Bearer expected"],
		["a longer token", "Bearer expected-token-and-more"],
		["the raw token without scheme", "expected-token"],
		["another scheme", "Basic expected-token"],
		["a lowercase scheme", "bearer expected-token"],
	])("refuses %s", (_label, authorization) => {
		const response = assertBearerToken(request({ authorization }), {
			expectedToken: "expected-token",
			tokenName: TOKEN_NAME,
		});

		expect(response?.status).toBe(401);
	});

	it("accepts the matching bearer token", () => {
		const response = assertBearerToken(
			request({ authorization: "Bearer expected-token" }),
			{ expectedToken: "expected-token", tokenName: TOKEN_NAME },
		);

		expect(response).toBeNull();
	});
});
