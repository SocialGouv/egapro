import { describe, expect, it } from "vitest";

import { impersonateSearchSchema, startImpersonateSchema } from "../schemas";

describe("admin schemas", () => {
	it("accepts a valid 9-digit SIREN", () => {
		expect(
			impersonateSearchSchema.safeParse({ siren: "123456789" }).success,
		).toBe(true);
		expect(
			startImpersonateSchema.safeParse({ siren: "987654321" }).success,
		).toBe(true);
	});

	it("strips spaces before validating (e.g. '775 670 417')", () => {
		const result = impersonateSearchSchema.safeParse({
			siren: "775 670 417",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.siren).toBe("775670417");
		}
	});

	it.each([
		"",
		"12345678",
		"1234567890",
		"12345678a",
		"abcdefghi",
	])("rejects invalid SIREN %s", (siren) => {
		expect(impersonateSearchSchema.safeParse({ siren }).success).toBe(false);
	});
});
