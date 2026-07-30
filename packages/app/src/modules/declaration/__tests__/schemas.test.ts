import { describe, expect, it } from "vitest";

import { e2eClockSchema } from "../schemas";

describe("e2eClockSchema", () => {
	it("accepts the lower campaign-year bound (2018)", () => {
		const result = e2eClockSchema.safeParse({ campaignYear: 2018 });
		expect(result.success).toBe(true);
		expect(result.data?.campaignYear).toBe(2018);
	});

	it("accepts the upper campaign-year bound (2100)", () => {
		const result = e2eClockSchema.safeParse({ campaignYear: 2100 });
		expect(result.success).toBe(true);
		expect(result.data?.campaignYear).toBe(2100);
	});

	it("rejects a year below the lower bound (2017)", () => {
		expect(e2eClockSchema.safeParse({ campaignYear: 2017 }).success).toBe(
			false,
		);
	});

	it("rejects a year above the upper bound (2101)", () => {
		expect(e2eClockSchema.safeParse({ campaignYear: 2101 }).success).toBe(
			false,
		);
	});

	it("rejects a non-integer year", () => {
		expect(e2eClockSchema.safeParse({ campaignYear: 2025.5 }).success).toBe(
			false,
		);
	});

	it("rejects a non-numeric year", () => {
		expect(e2eClockSchema.safeParse({ campaignYear: "2025" }).success).toBe(
			false,
		);
	});

	it("rejects a missing campaignYear field", () => {
		expect(e2eClockSchema.safeParse({}).success).toBe(false);
	});
});
