import { describe, expect, it } from "vitest";

import { resendReceiptSchema } from "../schemas";

const YEAR = 2025;

describe("resendReceiptSchema", () => {
	it.each([
		"declaration",
		"secondDeclaration",
		"cseOpinion",
		"representation",
	])("accepts a resend of the %s receipt", (kind) => {
		expect(resendReceiptSchema.safeParse({ kind, year: YEAR }).success).toBe(
			true,
		);
	});

	it.each([
		"jointEvaluation",
		"",
		"Representation",
	])("rejects the unsupported kind %s", (kind) => {
		expect(resendReceiptSchema.safeParse({ kind, year: YEAR }).success).toBe(
			false,
		);
	});

	it.each([2018, 2101, 2025.5])("rejects the year %s", (year) => {
		expect(
			resendReceiptSchema.safeParse({ kind: "representation", year }).success,
		).toBe(false);
	});
});
