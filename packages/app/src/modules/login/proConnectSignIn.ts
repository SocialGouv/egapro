import { signIn } from "next-auth/react";

import { USER_MFA_ACR_VALUES } from "~/modules/domain";

// Single entry point for the declarant sign-in. The `claims` request is what
// makes the MFA floor binding at ProConnect; the server re-checks the returned
// `acr` in `callbacks.signIn` — the client is never trusted to have asked, and
// `acr_values` (a mere preference an issuer may ignore) is never used.
//
// No `max_age` here: the declarant journey has no freshness window, unlike the
// backoffice step-up (`triggerAdminStepUp`).
export function triggerProConnectSignIn(returnPath: string): void {
	void signIn(
		"proconnect",
		{ callbackUrl: returnPath },
		{
			claims: JSON.stringify({
				id_token: {
					acr: { essential: true, values: [...USER_MFA_ACR_VALUES] },
				},
			}),
		},
	);
}
