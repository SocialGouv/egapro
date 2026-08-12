import { describe, expect, it } from "vitest";

import { referencePeriodSchema } from "~/modules/declaration-representation";
import {
	issues,
	VALID_REFERENCE_PERIOD as VALID_PERIOD,
	VALIDATION_MESSAGES,
	REPRESENTATION_YEAR as YEAR,
} from "./fixtures";

const DATE_FIELDS = ["referencePeriodStart", "referencePeriodEnd"] as const;

const MALFORMED_DATES = [
	["unreadable", "not-a-date"],
	["Date-parsable but non-ISO", "01/01/2025"],
	["ISO-shaped but non-existent", "2025-02-30"],
] as const;

describe("referencePeriodSchema", () => {
	it("accepts a calendar year ending in the declaration year", () => {
		expect(referencePeriodSchema(YEAR).safeParse(VALID_PERIOD).success).toBe(
			true,
		);
	});

	it("accepts a 12-month period straddling two calendar years", () => {
		const result = referencePeriodSchema(YEAR).safeParse({
			referencePeriodStart: "2024-07-01",
			referencePeriodEnd: "2025-06-30",
		});

		expect(result.success).toBe(true);
	});

	it("accepts a period starting on a leap day", () => {
		const result = referencePeriodSchema(YEAR).safeParse({
			referencePeriodStart: "2024-02-29",
			referencePeriodEnd: "2025-02-28",
		});

		expect(result.success).toBe(true);
	});

	it("rejects an end date whose year differs from the declaration year (S4)", () => {
		const result = referencePeriodSchema(YEAR).safeParse({
			referencePeriodStart: "2024-01-01",
			referencePeriodEnd: "2024-12-31",
		});

		expect(issues(result)).toContainEqual({
			path: "referencePeriodEnd",
			message: VALIDATION_MESSAGES.periodYear(YEAR),
		});
	});

	it.each([
		["after the reference year", "2027-04-03"],
		["on the calendar year right after it", "2026-01-01"],
		["more than one year before it", "2023-01-02"],
	])("rejects a start date %s", (_label, start) => {
		const result = referencePeriodSchema(YEAR).safeParse({
			referencePeriodStart: start,
			referencePeriodEnd: VALID_PERIOD.referencePeriodEnd,
		});

		expect(issues(result)).toContainEqual({
			path: "referencePeriodStart",
			message: VALIDATION_MESSAGES.periodYear(YEAR),
		});
	});

	it.each([
		["shorter than 12 months", "2025-06-01", "2025-12-31"],
		["longer than 12 months", "2024-12-01", "2025-12-31"],
		["off by one day", "2025-01-02", "2025-12-31"],
	])("rejects a period %s", (_label, start, end) => {
		const result = referencePeriodSchema(YEAR).safeParse({
			referencePeriodStart: start,
			referencePeriodEnd: end,
		});

		expect(issues(result)).toContainEqual({
			path: "referencePeriodEnd",
			message: VALIDATION_MESSAGES.periodLength,
		});
	});

	it.each(
		MALFORMED_DATES.flatMap(([shape, value]) =>
			DATE_FIELDS.map((field) => ({ shape, value, field })),
		),
	)("reports a $shape $field once, without stacking the period rules on top", ({
		value,
		field,
	}) => {
		const reported = issues(
			referencePeriodSchema(YEAR).safeParse({
				...VALID_PERIOD,
				[field]: value,
			}),
		);

		expect(reported).toHaveLength(1);
		expect(reported[0]?.path).toBe(field);
		expect([
			VALIDATION_MESSAGES.periodYear(YEAR),
			VALIDATION_MESSAGES.periodLength,
		]).not.toContain(reported[0]?.message);
	});

	it("reports one error per malformed date when neither can be read", () => {
		const reported = issues(
			referencePeriodSchema(YEAR).safeParse({
				referencePeriodStart: "not-a-date",
				referencePeriodEnd: "neither-is-this",
			}),
		);

		expect(reported.map((issue) => issue.path)).toEqual([
			"referencePeriodStart",
			"referencePeriodEnd",
		]);
	});
});
