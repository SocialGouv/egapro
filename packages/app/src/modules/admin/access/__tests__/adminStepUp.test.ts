import { signIn } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	ADMIN_MFA_ACR_VALUES,
	ADMIN_MFA_WINDOW_SECONDS,
} from "~/modules/domain";
import { triggerAdminStepUp } from "../adminStepUp";

const mockSignIn = vi.mocked(signIn);

type AuthorizationParams = { claims: string; max_age: string };

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
			acr: { essential: boolean; value: string };
			auth_time: { essential: boolean };
		};
	};
}

describe("triggerAdminStepUp", () => {
	beforeEach(() => {
		mockSignIn.mockClear();
	});

	it("signs in through the proconnect provider", () => {
		triggerAdminStepUp("/admin");

		expect(mockSignIn.mock.calls[0]?.[0]).toBe("proconnect");
	});

	it("carries the requested return path as the callback URL", () => {
		triggerAdminStepUp("/admin/declarations/abc");

		expect(mockSignIn).toHaveBeenCalledWith(
			"proconnect",
			{ callbackUrl: "/admin/declarations/abc" },
			expect.anything(),
		);
	});

	it("demands a second factor, not a higher eIDAS level", () => {
		triggerAdminStepUp("/admin");

		expect(ADMIN_MFA_ACR_VALUES[0]).toBe("eidas1-mfa");
		expect(parsedClaims().id_token.acr.value).toBe(ADMIN_MFA_ACR_VALUES[0]);
	});

	it("makes the level binding via an essential claim", () => {
		triggerAdminStepUp("/admin");

		expect(parsedClaims().id_token.acr.essential).toBe(true);
	});

	it("requests auth_time as essential so the window is computable", () => {
		triggerAdminStepUp("/admin");

		expect(parsedClaims().id_token.auth_time).toEqual({ essential: true });
	});

	it("caps the accepted session age at the backoffice window", () => {
		triggerAdminStepUp("/admin");

		expect(authorizationParamsFromCall().max_age).toBe(
			String(ADMIN_MFA_WINDOW_SECONDS),
		);
	});

	it("never falls back to acr_values, which an issuer may ignore", () => {
		triggerAdminStepUp("/admin");

		expect(authorizationParamsFromCall()).not.toHaveProperty("acr_values");
	});

	it("hands every authorization param as a string, as the query expects", () => {
		triggerAdminStepUp("/admin");

		for (const value of Object.values(authorizationParamsFromCall())) {
			expect(typeof value).toBe("string");
		}
	});

	it("carries claims and max_age, and nothing else", () => {
		triggerAdminStepUp("/admin");

		expect(Object.keys(authorizationParamsFromCall()).sort()).toEqual([
			"claims",
			"max_age",
		]);
	});
});
