import { signIn } from "next-auth/react";

import { buildAdminStepUpAuthorizationParams } from "~/server/auth/stepUpParams";

/**
 * Single entry point for every admin step-up sign-in: the "Administration"
 * menu entry (when the session's admin MFA is not fresh), the resume screen
 * at `/acces-backoffice`, and the login button when the validated
 * destination targets the backoffice. One path rather than three copies of
 * the same authorization params — three chances to drop one.
 *
 * `buildAdminStepUpAuthorizationParams` lives under `~/server/auth` but is
 * imported here, into code that reaches the browser: it is a pure,
 * deterministic function with no secret and no side effect — it only shapes
 * the `claims`/`max_age` query the browser sends to ProConnect. Attaching it
 * from the client is not itself a security control: a browser that omitted
 * it would simply sign in without the marker, and the server-side gates
 * (`resolveAdminAccess`, the `/admin` middleware, the admin tRPC procedures)
 * refuse that exactly as they refuse any other stale or missing second
 * factor. This only cuts the number of ProConnect round-trips for an agent
 * who already holds the grant.
 */
export function triggerAdminStepUp(returnPath: string): void {
	void signIn(
		"proconnect",
		{ callbackUrl: returnPath },
		buildAdminStepUpAuthorizationParams(),
	);
}
