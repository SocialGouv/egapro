import { describe, expect, it } from "vitest";

import { membersSchema } from "~/modules/declaration-representation";
import {
	COMPUTABLE_MEMBERS,
	issues,
	NO_MANAGEMENT_BODY,
	VALIDATION_MESSAGES,
} from "./fixtures";

describe("membersSchema", () => {
	it("accepts the absence of a management body without percentages", () => {
		expect(membersSchema.safeParse(NO_MANAGEMENT_BODY).success).toBe(true);
	});

	it("drops percentages sent alongside the absence of a management body", () => {
		const result = membersSchema.safeParse({
			hasManagementBody: false,
			memberWomenPercent: 55,
			memberMenPercent: 45,
		});

		expect(result.data).toEqual({ hasManagementBody: false });
	});

	it("accepts a management body with percentages summing to 100", () => {
		expect(membersSchema.safeParse(COMPUTABLE_MEMBERS).success).toBe(true);
	});

	it("rejects percentages that do not sum to 100 (S6)", () => {
		const result = membersSchema.safeParse({
			...COMPUTABLE_MEMBERS,
			memberMenPercent: 40,
		});

		expect(issues(result)).toContainEqual({
			path: "memberMenPercent",
			message: VALIDATION_MESSAGES.sum,
		});
	});

	it("rejects a management body without percentages", () => {
		const result = membersSchema.safeParse({ hasManagementBody: true });

		expect(issues(result).map((issue) => issue.path)).toEqual([
			"memberWomenPercent",
			"memberMenPercent",
		]);
	});

	it("rejects a percentage outside the 0-100 range", () => {
		const result = membersSchema.safeParse({
			...COMPUTABLE_MEMBERS,
			memberWomenPercent: 120,
		});

		expect(issues(result)).toContainEqual({
			path: "memberWomenPercent",
			message: VALIDATION_MESSAGES.range,
		});
	});
});
