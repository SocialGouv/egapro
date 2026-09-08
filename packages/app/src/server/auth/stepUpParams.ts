import {
	ADMIN_MFA_ACR_VALUES,
	ADMIN_MFA_WINDOW_SECONDS,
} from "~/modules/domain";

/**
 * Authentication level demanded of ProConnect when the destination is the
 * backoffice. Announced by the issuer's discovery document in
 * `acr_values_supported`, and orthogonal to the eIDAS scale: `eidas1-mfa` is
 * eIDAS 1 *plus* a second factor, so demanding it never raises the identity
 * verification level of the declarant journey.
 */
export const ADMIN_STEP_UP_ACR = ADMIN_MFA_ACR_VALUES[0];

/**
 * Extra authorization parameters carried by an admin sign-in.
 *
 * They are attached only to sign-in calls explicitly marked as admin; the
 * declarant journey on `/login` keeps the provider's own parameters, untouched.
 *
 * Two parameters, and both are needed:
 *
 * - `claims` rather than `acr_values`. In OIDC, `acr_values` is a *voluntary*
 *   preference an issuer may silently ignore; the `claims` parameter with
 *   `essential: true` is the only form that makes the requirement binding. The
 *   issuer advertises `claims_parameter_supported: true`. `auth_time` is
 *   requested essential too — without it we cannot date the authentication,
 *   and the window would be uncomputable.
 * - `max_age`, equal to the window. Without it an issuer replaying an already
 *   open session would answer with an old `auth_time` that our freshness rule
 *   refuses, bouncing the agent between the resume screen and ProConnect
 *   forever. With it, the issuer must re-authenticate.
 */
export function buildAdminStepUpAuthorizationParams(): Record<string, string> {
	return {
		claims: JSON.stringify({
			id_token: {
				acr: { essential: true, value: ADMIN_STEP_UP_ACR },
				auth_time: { essential: true },
			},
		}),
		max_age: String(ADMIN_MFA_WINDOW_SECONDS),
	};
}
