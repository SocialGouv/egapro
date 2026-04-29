import { z } from "zod";

const FRENCH_LOCAL_REGEX = /^0\d{9}$/;
const INTERNATIONAL_REGEX = /^\+\d{8,15}$/;
const PHONE_ERROR = "Format attendu : 01 22 33 44 55 ou +33 1 22 33 44 55";

/** Strip whitespace, dots, and dashes. Keeps + and digits. */
export function normalizePhone(value: string): string {
	return value.replace(/[\s.-]/g, "");
}

/**
 * Convert any accepted input to canonical international form (+CC followed by
 * national digits). Accepts French local (10 digits starting with 0, mapped to
 * +33...) or international with leading +. Returns null if the input is not a
 * valid phone number.
 */
export function toCanonicalPhone(value: string): string | null {
	const normalized = normalizePhone(value);
	if (INTERNATIONAL_REGEX.test(normalized)) return normalized;
	if (FRENCH_LOCAL_REGEX.test(normalized)) return `+33${normalized.slice(1)}`;
	return null;
}

/**
 * Format a canonical phone for display with pair-spacing. French numbers
 * (+33 + 9 digits) follow the conventional "+33 X XX XX XX XX" layout; other
 * numbers are split as "+CC NN NN NN…" with CC defaulting to 2 digits.
 */
export function formatPhone(canonical: string): string {
	if (canonical.startsWith("+33") && canonical.length === 12) {
		const n = canonical.slice(3);
		return `+33 ${n[0]} ${n.slice(1, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
	}
	if (INTERNATIONAL_REGEX.test(canonical)) {
		const cc = canonical.slice(1, 3);
		const national = canonical.slice(3);
		const grouped = national.match(/.{1,2}/g)?.join(" ") ?? national;
		return `+${cc} ${grouped}`;
	}
	return canonical;
}

/**
 * Format a user-typed phone number with pair-spacing for live input display.
 * Without a leading "+": treats the digits as a French local number and groups
 * them as pairs ("01 22 33 44 55"). With a leading "+": uses international
 * format with the French "+33 X XX XX XX XX" layout when CC=33, otherwise
 * "+CC NN NN…". Tolerates partial input as the user types.
 */
export function formatPhoneInput(raw: string): string {
	const hasPlus = raw.trimStart().startsWith("+");
	const digits = raw.replace(/\D/g, "");
	if (!hasPlus) {
		return digits.match(/.{1,2}/g)?.join(" ") ?? "";
	}
	if (digits.length === 0) return "+";
	if (digits.length <= 2) return `+${digits}`;
	const cc = digits.slice(0, 2);
	const rest = digits.slice(2);
	if (cc === "33") {
		const groups: string[] = ["+33"];
		if (rest.length >= 1) groups.push(rest.slice(0, 1));
		if (rest.length >= 2) groups.push(rest.slice(1, 3));
		if (rest.length >= 4) groups.push(rest.slice(3, 5));
		if (rest.length >= 6) groups.push(rest.slice(5, 7));
		if (rest.length >= 8) groups.push(rest.slice(7, 9));
		return groups.join(" ");
	}
	const grouped = rest.match(/.{1,2}/g)?.join(" ") ?? rest;
	return `+${cc} ${grouped}`;
}

/**
 * Zod schema validating French local or international phone numbers and
 * normalizing them to the canonical "+CC…" form for storage.
 */
export const phoneSchema = z.string().transform((value, ctx) => {
	const canonical = toCanonicalPhone(value);
	if (canonical === null) {
		ctx.addIssue({ code: "custom", message: PHONE_ERROR });
		return z.NEVER;
	}
	return canonical;
});
