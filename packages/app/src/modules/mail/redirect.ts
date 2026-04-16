import { env } from "~/env.js";

/**
 * Parses MAIL_REDIRECT_MAP once at module load. Malformed JSON resolves to an
 * empty map — misconfiguring the env var must never crash the app.
 */
const redirectMap: Record<string, string> = (() => {
	try {
		const parsed = JSON.parse(env.MAIL_REDIRECT_MAP) as unknown;
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			const out: Record<string, string> = {};
			for (const [k, v] of Object.entries(parsed)) {
				if (typeof v === "string") out[k.toLowerCase()] = v;
			}
			return out;
		}
	} catch {
		// fall through
	}
	return {};
})();

export function resolveRecipient(to: string): {
	to: string;
	originalTo?: string;
} {
	const replacement = redirectMap[to.toLowerCase()];
	if (replacement && replacement !== to) {
		return { to: replacement, originalTo: to };
	}
	return { to };
}
