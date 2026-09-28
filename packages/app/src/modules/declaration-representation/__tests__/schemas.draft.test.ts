import { describe, expect, it } from "vitest";

import { representationDraftSchema } from "~/modules/declaration-representation";

describe("representationDraftSchema", () => {
	it("accepts a draft holding only the current step", () => {
		expect(
			representationDraftSchema.safeParse({ currentStep: 0 }).success,
		).toBe(true);
	});

	it("accepts a partially filled draft", () => {
		const result = representationDraftSchema.safeParse({
			currentStep: 3,
			referencePeriodStart: "2025-01-01",
			executivesCount: "two_or_more",
			executiveWomenPercent: 60,
			hasManagementBody: true,
		});

		expect(result.success).toBe(true);
	});

	it("accepts a draft holding percentages that do not sum to 100", () => {
		const result = representationDraftSchema.safeParse({
			currentStep: 2,
			executiveWomenPercent: 10,
			executiveMenPercent: 20,
		});

		expect(result.success).toBe(true);
	});

	it.each([-1, 6, 2.5])("rejects the current step %s", (currentStep) => {
		expect(representationDraftSchema.safeParse({ currentStep }).success).toBe(
			false,
		);
	});

	it("rejects a draft without a current step", () => {
		expect(representationDraftSchema.safeParse({}).success).toBe(false);
	});

	it("rejects an unknown executives count", () => {
		const result = representationDraftSchema.safeParse({
			currentStep: 1,
			executivesCount: "three",
		});

		expect(result.success).toBe(false);
	});
});
