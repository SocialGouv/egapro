import { describe, expect, it } from "vitest";

import { submitRepresentationSchema } from "~/modules/declaration-representation";
import {
	COMPUTABLE_EXECUTIVES,
	COMPUTABLE_MEMBERS,
	FULL_REPRESENTATION_PAYLOAD as FULL_PAYLOAD,
	issues,
	NO_EXECUTIVES,
	NO_MANAGEMENT_BODY,
	VALID_REFERENCE_PERIOD as VALID_PERIOD,
	WEBSITE_PUBLICATION as VALID_PUBLICATION,
	VALIDATION_MESSAGES,
	REPRESENTATION_YEAR as YEAR,
} from "./fixtures";

describe("submitRepresentationSchema", () => {
	it("accepts a complete declaration with both gaps computable (S19)", () => {
		const result = submitRepresentationSchema(YEAR).safeParse(FULL_PAYLOAD);

		expect(result.data).toEqual(FULL_PAYLOAD);
	});

	it("accepts a declaration without any computable gap and no publication", () => {
		const result = submitRepresentationSchema(YEAR).safeParse({
			...VALID_PERIOD,
			...NO_EXECUTIVES,
			...NO_MANAGEMENT_BODY,
		});

		expect(result.success).toBe(true);
	});

	it.each([
		["only the executives gap", COMPUTABLE_EXECUTIVES, NO_MANAGEMENT_BODY],
		["only the members gap", NO_EXECUTIVES, COMPUTABLE_MEMBERS],
	])("requires publication when %s is computable (S12)", (_l, exec, members) => {
		const result = submitRepresentationSchema(YEAR).safeParse({
			...VALID_PERIOD,
			...exec,
			...members,
		});

		expect(issues(result).map((issue) => issue.path)).toContain("publishDate");
	});

	it.each([
		["only the executives gap", COMPUTABLE_EXECUTIVES, NO_MANAGEMENT_BODY],
		["only the members gap", NO_EXECUTIVES, COMPUTABLE_MEMBERS],
	])("accepts publication when %s is computable (S12)", (_l, exec, members) => {
		const result = submitRepresentationSchema(YEAR).safeParse({
			...VALID_PERIOD,
			...exec,
			...members,
			...VALID_PUBLICATION,
		});

		expect(result.success).toBe(true);
	});

	it.each([
		["publishDate", { publishDate: "2026-03-01" }],
		["hasWebsite", { hasWebsite: false }],
		["publishUrl", { publishUrl: "https://exemple.fr/egalite" }],
		["publishModalities", { publishModalities: "Affichage." }],
	])("rejects %s when no gap is computable (S12)", (_label, publication) => {
		const result = submitRepresentationSchema(YEAR).safeParse({
			...VALID_PERIOD,
			...NO_EXECUTIVES,
			...NO_MANAGEMENT_BODY,
			...publication,
		});

		expect(issues(result)).toContainEqual({
			path: "publishDate",
			message: VALIDATION_MESSAGES.publicationNotRequired,
		});
	});

	it.each([
		["before the end of the reference period", "2025-12-30"],
		["on the end of the reference period", "2025-12-31"],
	])("rejects a publication date %s (S11)", (_label, publishDate) => {
		const result = submitRepresentationSchema(YEAR).safeParse({
			...FULL_PAYLOAD,
			publishDate,
		});

		expect(issues(result)).toContainEqual({
			path: "publishDate",
			message: VALIDATION_MESSAGES.publishDateAfterPeriod,
		});
	});

	it("accepts a publication date on the day after the reference period", () => {
		const result = submitRepresentationSchema(YEAR).safeParse({
			...FULL_PAYLOAD,
			publishDate: "2026-01-01",
		});

		expect(result.success).toBe(true);
	});

	it("forwards the publication issues when the publication is malformed", () => {
		const result = submitRepresentationSchema(YEAR).safeParse({
			...FULL_PAYLOAD,
			publishUrl: "pas une url",
		});

		expect(issues(result)).toContainEqual({
			path: "publishUrl",
			message: VALIDATION_MESSAGES.urlInvalid,
		});
	});

	it("reports the reference period issue when the year does not match (S4)", () => {
		const otherYear = YEAR + 1;

		const result =
			submitRepresentationSchema(otherYear).safeParse(FULL_PAYLOAD);

		expect(issues(result)).toContainEqual({
			path: "referencePeriodEnd",
			message: VALIDATION_MESSAGES.periodYear(otherYear),
		});
	});

	it("rejects an empty payload without throwing", () => {
		const result = submitRepresentationSchema(YEAR).safeParse({});

		expect(result.success).toBe(false);
	});
});
