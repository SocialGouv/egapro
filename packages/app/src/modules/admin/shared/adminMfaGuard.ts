export const ADMIN_MFA_REQUIRED_MARKER = "adminMfaRequired" as const;

export const ADMIN_MFA_REQUIRED_MESSAGE =
	"La double authentification administrateur doit être refaite pour continuer.";

// Distinguishes an MFA-window refusal from every other error `adminProcedure`
// can throw (habilitation, or any downstream procedure error): only this
// cause flips the marker in the tRPC error shape, so callers never compare
// the message string to tell the two refusals apart.
export class AdminMfaRequiredError extends Error {
	constructor() {
		super(ADMIN_MFA_REQUIRED_MESSAGE);
		this.name = "AdminMfaRequiredError";
	}
}

export function isAdminMfaRequiredErrorData(data: unknown): boolean {
	return (
		typeof data === "object" &&
		data !== null &&
		(data as Record<string, unknown>)[ADMIN_MFA_REQUIRED_MARKER] === true
	);
}
