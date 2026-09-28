import { signIn } from "next-auth/react";

import {
	ADMIN_MFA_ACR_VALUES,
	ADMIN_MFA_WINDOW_SECONDS,
} from "~/modules/domain";

// Orthogonal to the eIDAS scale — `eidas1-mfa` is eIDAS 1 *plus* a second
// factor — so demanding it never raises the declarant journey's identity level.
const ADMIN_STEP_UP_ACR = ADMIN_MFA_ACR_VALUES[0];

// Single entry point for every admin step-up sign-in (menu, resume screen,
// login button) — one path rather than three copies of the same params.
// Attaching them client-side is not a security control: the server gates
// (resolveAdminAccess, the /admin middleware, the admin tRPC procedures)
// refuse a stale or missing second factor regardless.
export function triggerAdminStepUp(returnPath: string): void {
	void signIn(
		"proconnect",
		{ callbackUrl: returnPath },
		{
			// `claims`, not `acr_values`: an essential claim is binding, a voluntary preference is not.
			claims: JSON.stringify({
				id_token: {
					acr: { essential: true, value: ADMIN_STEP_UP_ACR },
					auth_time: { essential: true },
				},
			}),
			// Bounds the accepted auth_time to the backoffice freshness window.
			max_age: String(ADMIN_MFA_WINDOW_SECONDS),
		},
	);
}
