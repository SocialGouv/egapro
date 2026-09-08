import { signIn } from "next-auth/react";

import {
	ADMIN_MFA_ACR_VALUES,
	ADMIN_MFA_WINDOW_SECONDS,
} from "~/modules/domain";

// Orthogonal to the eIDAS scale — `eidas1-mfa` is eIDAS 1 *plus* a second
// factor — so demanding it never raises the declarant journey's identity level.
const ADMIN_STEP_UP_ACR = ADMIN_MFA_ACR_VALUES[0];

/**
 * Single entry point for every admin step-up sign-in: the "Administration"
 * menu entry (when the session's admin MFA is not fresh), the resume screen
 * at `/acces-backoffice`, and the login button when the validated
 * destination targets the backoffice. One path rather than three copies of
 * the same authorization params — three chances to drop one.
 */
export function triggerAdminStepUp(returnPath: string): void {
	void signIn(
		"proconnect",
		{ callbackUrl: returnPath },
		{
			// `claims` rather than `acr_values`: in OIDC `acr_values` is a
			// voluntary preference an issuer may silently ignore, an essential
			// claim is binding.
			claims: JSON.stringify({
				id_token: {
					acr: { essential: true, value: ADMIN_STEP_UP_ACR },
					auth_time: { essential: true },
				},
			}),
			// Without it an issuer replaying an already open session answers with
			// an old `auth_time` that the freshness rule refuses, looping the
			// agent between the resume screen and ProConnect. Attaching this from
			// the client is not a security control: a browser that omitted it
			// would simply sign in without the marker, and the server-side gates
			// (`resolveAdminAccess`, the `/admin` middleware, the admin tRPC
			// procedures) refuse that exactly as they refuse any other stale or
			// missing second factor.
			max_age: String(ADMIN_MFA_WINDOW_SECONDS),
		},
	);
}
