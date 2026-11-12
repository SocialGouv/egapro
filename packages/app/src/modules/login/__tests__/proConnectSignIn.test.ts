import { signIn } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_MFA_ACR_VALUES } from "~/modules/domain";
import { triggerProConnectSignIn } from "../proConnectSignIn";

const mockSignIn = vi.mocked(signIn);

type AuthorizationParams = { claims: string };

function authorizationParamsFromCall(): AuthorizationParams {
	const params = mockSignIn.mock.calls[0]?.[2] as
		| AuthorizationParams
		| undefined;
	if (!params)
		throw new Error("signIn was not called with authorization params");
	return params;
}

function parsedClaims() {
	return JSON.parse(authorizationParamsFromCall().claims) as {
		id_token: {
			acr: { essential: boolean; values: string[] };
		};
	};
}

describe("triggerProConnectSignIn", () => {
	beforeEach(() => {
		mockSignIn.mockClear();
	});

	it("signs in through the proconnect provider", () => {
		triggerProConnectSignIn("/mon-espace");

		expect(mockSignIn.mock.calls[0]?.[0]).toBe("proconnect");
	});

	it("carries the requested return path as the callback URL", () => {
		triggerProConnectSignIn("/declaration-remuneration");

		expect(mockSignIn).toHaveBeenCalledWith(
			"proconnect",
			{ callbackUrl: "/declaration-remuneration" },
			expect.anything(),
		);
	});

	it("demands the full declarant MFA set, from the single source of truth", () => {
		triggerProConnectSignIn("/mon-espace");

		expect(parsedClaims().id_token.acr.values).toEqual([
			...USER_MFA_ACR_VALUES,
		]);
	});

	it("makes the level binding via an essential claim", () => {
		triggerProConnectSignIn("/mon-espace");

		expect(parsedClaims().id_token.acr.essential).toBe(true);
	});

	it("never falls back to acr_values, which an issuer may ignore", () => {
		triggerProConnectSignIn("/mon-espace");

		expect(authorizationParamsFromCall()).not.toHaveProperty("acr_values");
	});

	it("carries no freshness window, unlike the backoffice step-up", () => {
		triggerProConnectSignIn("/mon-espace");

		expect(authorizationParamsFromCall()).not.toHaveProperty("max_age");
		expect(parsedClaims().id_token).not.toHaveProperty("auth_time");
	});

	it("hands every authorization param as a string, as the query expects", () => {
		triggerProConnectSignIn("/mon-espace");

		for (const value of Object.values(authorizationParamsFromCall())) {
			expect(typeof value).toBe("string");
		}
	});
});
