import { describe, expect, it } from "vitest";

import {
	getRepresentationDeclarationSchema,
	saveRepresentationDraftSchema,
	submitRepresentationDeclarationSchema,
} from "~/modules/declaration-representation";
import { declareRepresentationNotSubjectSchema } from "~/modules/declaration-representation/schemas";
import { REPRESENTATION_YEAR as YEAR } from "./fixtures";

describe("router input schemas", () => {
	it("drops a client-supplied siren from the get input", () => {
		const result = getRepresentationDeclarationSchema.safeParse({
			year: YEAR,
			siren: "999999999",
		});

		expect(result.data).toEqual({ year: YEAR });
	});

	it("drops a client-supplied siren from the saveDraft input", () => {
		const result = saveRepresentationDraftSchema.safeParse({
			year: YEAR,
			siren: "999999999",
			draft: { currentStep: 1 },
			currentStep: 1,
		});

		expect(result.data).toEqual({
			year: YEAR,
			draft: { currentStep: 1 },
			currentStep: 1,
		});
	});

	it("drops a client-supplied siren from the submit input", () => {
		const result = submitRepresentationDeclarationSchema.safeParse({
			year: YEAR,
			siren: "999999999",
			payload: { executivesCount: "none" },
		});

		expect(result.data).toEqual({
			year: YEAR,
			payload: { executivesCount: "none" },
		});
	});

	it("drops a client-supplied siren and status from the declareNotSubject input", () => {
		const result = declareRepresentationNotSubjectSchema.safeParse({
			year: YEAR,
			siren: "999999999",
			status: "submitted",
		});

		expect(result.data).toEqual({ year: YEAR });
	});

	it.each([
		1999, 2101,
	])("rejects the out-of-range year %s on the declareNotSubject input", (year) => {
		expect(
			declareRepresentationNotSubjectSchema.safeParse({ year }).success,
		).toBe(false);
	});

	it.each([2025.5, Number.NaN])("rejects the year %s", (year) => {
		expect(getRepresentationDeclarationSchema.safeParse({ year }).success).toBe(
			false,
		);
	});

	it.each([1999, 2101])("rejects the out-of-range year %s", (year) => {
		expect(getRepresentationDeclarationSchema.safeParse({ year }).success).toBe(
			false,
		);
	});

	it.each([2000, 2100])("accepts the boundary year %s", (year) => {
		expect(getRepresentationDeclarationSchema.safeParse({ year }).success).toBe(
			true,
		);
	});

	it.each([
		[
			"saveDraft",
			(year: number) =>
				saveRepresentationDraftSchema.safeParse({
					year,
					draft: { currentStep: 0 },
					currentStep: 0,
				}),
		],
		[
			"submit",
			(year: number) =>
				submitRepresentationDeclarationSchema.safeParse({ year, payload: {} }),
		],
	])("rejects an out-of-range year on the %s input", (_label, parse) => {
		expect(parse(1999).success).toBe(false);
		expect(parse(2101).success).toBe(false);
		expect(parse(YEAR).success).toBe(true);
	});

	it.each([-1, 6])("rejects the saveDraft current step %s", (currentStep) => {
		const result = saveRepresentationDraftSchema.safeParse({
			year: YEAR,
			draft: { currentStep: 0 },
			currentStep,
		});

		expect(result.success).toBe(false);
	});

	it("rejects a submit payload that is not an object", () => {
		const result = submitRepresentationDeclarationSchema.safeParse({
			year: YEAR,
			payload: "not-an-object",
		});

		expect(result.success).toBe(false);
	});
});
