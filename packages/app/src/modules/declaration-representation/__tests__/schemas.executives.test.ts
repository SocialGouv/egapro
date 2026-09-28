import { describe, expect, it } from "vitest";

import { executivesSchema } from "~/modules/declaration-representation";
import { COMPUTABLE_EXECUTIVES, issues, VALIDATION_MESSAGES } from "./fixtures";

describe("executivesSchema", () => {
	it.each([
		"none",
		"one",
	])("accepts %s executives without any percentage", (executivesCount) => {
		const result = executivesSchema.safeParse({ executivesCount });

		expect(result.success).toBe(true);
	});

	it("drops percentages sent alongside a non-computable count", () => {
		const result = executivesSchema.safeParse({
			executivesCount: "none",
			executiveWomenPercent: 60,
			executiveMenPercent: 40,
		});

		expect(result.data).toEqual({ executivesCount: "none" });
	});

	it("accepts two or more executives with percentages summing to 100", () => {
		expect(executivesSchema.safeParse(COMPUTABLE_EXECUTIVES).success).toBe(
			true,
		);
	});

	it("accepts one-decimal percentages summing to 100", () => {
		const result = executivesSchema.safeParse({
			executivesCount: "two_or_more",
			executiveWomenPercent: 33.3,
			executiveMenPercent: 66.7,
		});

		expect(result.success).toBe(true);
	});

	it("rejects percentages that do not sum to 100 (S6)", () => {
		const result = executivesSchema.safeParse({
			...COMPUTABLE_EXECUTIVES,
			executiveMenPercent: 30,
		});

		expect(issues(result)).toContainEqual({
			path: "executiveMenPercent",
			message: VALIDATION_MESSAGES.sum,
		});
	});

	it("rejects two or more executives without percentages", () => {
		const result = executivesSchema.safeParse({
			executivesCount: "two_or_more",
		});

		expect(issues(result).map((issue) => issue.path)).toEqual([
			"executiveWomenPercent",
			"executiveMenPercent",
		]);
	});

	it.each([
		["above 100", 101, VALIDATION_MESSAGES.range],
		["below 0", -1, VALIDATION_MESSAGES.range],
		["with two decimals", 33.33, VALIDATION_MESSAGES.decimal],
	])("rejects a percentage %s", (_label, executiveWomenPercent, message) => {
		const result = executivesSchema.safeParse({
			...COMPUTABLE_EXECUTIVES,
			executiveWomenPercent,
		});

		expect(issues(result)).toContainEqual({
			path: "executiveWomenPercent",
			message,
		});
	});

	it("rejects an unknown executives count", () => {
		expect(
			executivesSchema.safeParse({ executivesCount: "three" }).success,
		).toBe(false);
	});
});
