import { z } from "zod";

/** Strip spaces, dots, and dashes from a phone string to get raw digits. */
export function normalizePhone(value: string): string {
	return value.replace(/[\s.-]/g, "");
}

/** Regex for a 10-digit French phone number (after normalization). */
export const phoneDigitsRegex = /^\d{10}$/;

/** Format a 10-digit phone string into "XX XX XX XX XX". */
export function formatPhone(digits: string): string {
	return digits.replace(/(\d{2})(?=\d)/g, "$1 ");
}

/** Zod schema for validating French phone numbers (accepts spaces, dots, dashes). */
export const phoneSchema = z
	.string()
	.transform(normalizePhone)
	.pipe(z.string().regex(phoneDigitsRegex, "Format attendu : 01 22 33 44 55"));
