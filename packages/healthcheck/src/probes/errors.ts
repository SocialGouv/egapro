import { sanitizeMessage } from "../sanitize.js";

const NETWORK_MESSAGES: Record<string, string> = {
	ECONNREFUSED: "connexion refusée",
	ECONNRESET: "connexion réinitialisée",
	ETIMEDOUT: "délai dépassé",
	EHOSTUNREACH: "hôte injoignable",
	ENETUNREACH: "réseau injoignable",
	ENOTFOUND: "hôte introuvable",
	EAI_AGAIN: "résolution DNS indisponible",
	EAUTH: "authentification refusée",
	ECONNECTION: "échec de la connexion",
	ESOCKET: "échec de la connexion",
};

export function errorCode(error: unknown): string | null {
	if (typeof error !== "object" || error === null || !("code" in error)) {
		return null;
	}
	const { code } = error as { code: unknown };
	return typeof code === "string" && code.length > 0 ? code : null;
}

// Socket-level errors embed the target host and port in their message. The
// probe screen is read by admins, but the stored message must still carry no
// infrastructure detail, so the code is mapped to a fixed wording first.
export function describeError(
	error: unknown,
	secrets: readonly string[],
	fallback?: string,
): string {
	const code = errorCode(error);
	if (code) return NETWORK_MESSAGES[code] ?? sanitizeMessage(error, secrets);
	return fallback ?? sanitizeMessage(error, secrets);
}

export function isAuthenticationError(error: unknown): boolean {
	const code = errorCode(error);
	if (code && AUTHENTICATION_CODES.has(code)) return true;
	const message = error instanceof Error ? error.message : "";
	return AUTHENTICATION_HINTS.test(message);
}

const AUTHENTICATION_CODES = new Set(["EAUTH", "28000", "28P01"]);
const AUTHENTICATION_HINTS =
	/WRONGPASS|NOAUTH|AUTH failed|authentication failed/i;
