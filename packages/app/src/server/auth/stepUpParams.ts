import {
	ADMIN_MFA_ACR_VALUES,
	ADMIN_MFA_WINDOW_SECONDS,
} from "~/modules/domain";

// Orthogonal to the eIDAS scale — `eidas1-mfa` is eIDAS 1 *plus* a second
// factor — so demanding it never raises the declarant journey's identity level.
export const ADMIN_STEP_UP_ACR = ADMIN_MFA_ACR_VALUES[0];

export type AdminStepUpAuthorizationParams = {
	claims: string;
	max_age: string;
};

// Attached only to sign-ins explicitly marked as admin; the declarant journey
// on `/login` keeps the provider's own parameters untouched.
export function buildAdminStepUpAuthorizationParams(): AdminStepUpAuthorizationParams {
	return {
		// `claims` rather than `acr_values`: in OIDC `acr_values` is a voluntary
		// preference an issuer may silently ignore, an essential claim is binding.
		claims: JSON.stringify({
			id_token: {
				acr: { essential: true, value: ADMIN_STEP_UP_ACR },
				auth_time: { essential: true },
			},
		}),
		// Without it an issuer replaying an already open session answers with an
		// old `auth_time` that the freshness rule refuses, looping the agent
		// between the resume screen and ProConnect.
		max_age: String(ADMIN_MFA_WINDOW_SECONDS),
	};
}
