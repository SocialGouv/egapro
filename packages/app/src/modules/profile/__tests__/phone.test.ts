import { describe, expect, it } from "vitest";

import {
	formatPhone,
	normalizePhone,
	phoneSchema,
	toCanonicalPhone,
} from "../phone";

describe("normalizePhone", () => {
	it("strips spaces, dots, and dashes", () => {
		expect(normalizePhone("01 22 33-44.55")).toBe("0122334455");
	});

	it("preserves the leading +", () => {
		expect(normalizePhone("+33 1 22 33 44 55")).toBe("+33122334455");
	});
});

describe("toCanonicalPhone", () => {
	it("converts a French local number to +33 international form", () => {
		expect(toCanonicalPhone("01 22 33 44 55")).toBe("+33122334455");
	});

	it("keeps an international number unchanged", () => {
		expect(toCanonicalPhone("+33 1 22 33 44 55")).toBe("+33122334455");
	});

	it("accepts a country code with 1 digit", () => {
		expect(toCanonicalPhone("+1 555 123 4567")).toBe("+15551234567");
	});

	it("accepts a country code with 3 digits (Iceland)", () => {
		expect(toCanonicalPhone("+354 555 1234")).toBe("+3545551234");
	});

	it("rejects a number that is too short", () => {
		expect(toCanonicalPhone("0122")).toBeNull();
	});

	it("rejects a French local number without leading 0", () => {
		expect(toCanonicalPhone("122334455")).toBeNull();
	});

	it("rejects letters", () => {
		expect(toCanonicalPhone("01 22 ABC 44 55")).toBeNull();
	});
});

describe("formatPhone", () => {
	it("formats a French canonical number as +33 X XX XX XX XX", () => {
		expect(formatPhone("+33122334455")).toBe("+33 1 22 33 44 55");
	});

	it("formats a non-French international number with default 2-digit CC", () => {
		expect(formatPhone("+15551234567")).toBe("+15 55 12 34 56 7");
	});

	it("returns the input unchanged for a non-canonical value", () => {
		expect(formatPhone("0122334455")).toBe("0122334455");
	});
});

describe("phoneSchema", () => {
	it("accepts a French local number with separators", () => {
		expect(phoneSchema.parse("01 22 33-44.55")).toBe("+33122334455");
	});

	it("accepts an international number", () => {
		expect(phoneSchema.parse("+33 1 22 33 44 55")).toBe("+33122334455");
	});

	it("rejects an invalid format", () => {
		const result = phoneSchema.safeParse("123");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toContain(
				"01 22 33 44 55 ou +33 1 22 33 44 55",
			);
		}
	});
});
