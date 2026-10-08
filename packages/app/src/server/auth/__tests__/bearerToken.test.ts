import { afterEach, describe, expect, it, vi } from "vitest";

import { rejectInvalidBearerToken } from "../bearerToken";

const TOKEN_NAME = "EGAPRO_TEST_API_TOKEN";

function request(headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/test", { method: "POST", headers });
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("rejectInvalidBearerToken", () => {
	it("refuses with 401 and logs when the expected token is not configured", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const tokenName = "EGAPRO_UNSET_API_TOKEN";

		const response = rejectInvalidBearerToken(
			request({ authorization: "Bearer anything" }),
			{ expectedToken: undefined, tokenName },
		);

		expect(response?.status).toBe(401);
		await expect(response?.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(tokenName));
	});

	it("logs a missing token once, not on every refused request", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const options = {
			expectedToken: undefined,
			tokenName: "EGAPRO_ONCE_API_TOKEN",
		};

		rejectInvalidBearerToken(request(), options);
		rejectInvalidBearerToken(request(), options);
		rejectInvalidBearerToken(request(), options);

		expect(errorSpy).toHaveBeenCalledTimes(1);
	});

	it("refuses an empty expected token, even against an empty bearer", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const tokenName = "EGAPRO_EMPTY_API_TOKEN";

		const response = rejectInvalidBearerToken(
			request({ authorization: "Bearer " }),
			{
				expectedToken: "",
				tokenName,
			},
		);

		expect(response?.status).toBe(401);
		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(tokenName));
	});

	it("refuses a request without an authorization header", () => {
		const response = rejectInvalidBearerToken(request(), {
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
		const response = rejectInvalidBearerToken(request({ authorization }), {
			expectedToken: "expected-token",
			tokenName: TOKEN_NAME,
		});

		expect(response?.status).toBe(401);
	});

	it("accepts the matching bearer token", () => {
		const response = rejectInvalidBearerToken(
			request({ authorization: "Bearer expected-token" }),
			{ expectedToken: "expected-token", tokenName: TOKEN_NAME },
		);

		expect(response).toBeNull();
	});
});
