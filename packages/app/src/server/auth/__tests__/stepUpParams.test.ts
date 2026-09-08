import { describe, expect, it } from "vitest";
import { ADMIN_MFA_WINDOW_SECONDS } from "~/modules/domain";
import {
	ADMIN_STEP_UP_ACR,
	buildAdminStepUpAuthorizationParams,
} from "../stepUpParams";

type ClaimsParameter = {
	id_token: {
		acr: { essential: boolean; value: string };
		auth_time: { essential: boolean };
	};
};

function parsedClaims(): ClaimsParameter {
	const { claims } = buildAdminStepUpAuthorizationParams();
	return JSON.parse(claims) as ClaimsParameter;
}

describe("buildAdminStepUpAuthorizationParams", () => {
	it("demands a second factor, not a higher eIDAS level", () => {
		expect(ADMIN_STEP_UP_ACR).toBe("eidas1-mfa");
		expect(parsedClaims().id_token.acr.value).toBe("eidas1-mfa");
	});

	it("makes the level binding via an essential claim", () => {
		expect(parsedClaims().id_token.acr.essential).toBe(true);
	});

	it("requests auth_time as essential so the window is computable", () => {
		expect(parsedClaims().id_token.auth_time).toEqual({ essential: true });
	});

	it("never falls back to acr_values, which an issuer may ignore", () => {
		expect(buildAdminStepUpAuthorizationParams()).not.toHaveProperty(
			"acr_values",
		);
	});

	it("caps the accepted session age at the backoffice window", () => {
		expect(buildAdminStepUpAuthorizationParams().max_age).toBe(
			String(ADMIN_MFA_WINDOW_SECONDS),
		);
	});

	it("carries claims and max_age, and nothing else", () => {
		expect(Object.keys(buildAdminStepUpAuthorizationParams()).sort()).toEqual([
			"claims",
			"max_age",
		]);
	});

	it("hands every value as a string, as an authorization query expects", () => {
		for (const value of Object.values(buildAdminStepUpAuthorizationParams())) {
			expect(typeof value).toBe("string");
		}
	});

	it("does not touch the scopes of the declarant journey", () => {
		expect(buildAdminStepUpAuthorizationParams()).not.toHaveProperty("scope");
	});
});
