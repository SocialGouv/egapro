import { z } from "zod";

/** Regex for French phone number format: "01 22 33 44 55" (5 pairs of digits separated by spaces). */
export const phoneRegex = /^\d{2}( \d{2}){4}$/;

/** Zod schema for validating French phone numbers. */
export const phoneSchema = z
	.string()
	.regex(phoneRegex, "Format attendu : 01 22 33 44 55");
