// MFA floor for every non-backoffice ProConnect sign-in (issue #4961).
//
// The list is the full set of levels that prove a second factor, as published
// by ProConnect's "forcer la double authentification" documentation. A provider
// that returns any other value did not satisfy the essential ACR claim, and
// `callbacks.signIn` refuses to open a session.
export const USER_MFA_ACR_VALUES = [
	"eidas0-mfa",
	"eidas1-mfa",
	"eidas2",
	"eidas3",
] as const;

const USER_MFA_ACR_SET: ReadonlySet<string> = new Set(USER_MFA_ACR_VALUES);

export function isUserMfaAcr(acr: unknown): boolean {
	return typeof acr === "string" && USER_MFA_ACR_SET.has(acr);
}
