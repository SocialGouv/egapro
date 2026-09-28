import { describe, expect, it } from "vitest";
import {
	clampRepresentationStep,
	DECLARATION_REMUNERATION,
	DECLARATION_REMUNERATION_RECAP,
	DECLARATION_REMUNERATION_RECAP_CORRECTION,
	DECLARATION_REPRESENTATION,
	DECLARATION_REPRESENTATION_CONFIRMATION,
	FIRST_REMUNERATION_STEP,
	FIRST_REPRESENTATION_STEP,
	LAST_REMUNERATION_STEP,
	LAST_REPRESENTATION_STEP,
	REMUNERATION_STEP_NUMBERS,
	REPRESENTATION_STEP_NUMBERS,
	remunerationStepHref,
	representationStepHref,
	toRemunerationStep,
	toRepresentationStep,
} from "../shared/declarationRoutes";

describe("rémunération funnel", () => {
	it("spells the entry points", () => {
		expect(DECLARATION_REMUNERATION).toBe("/declaration-remuneration");
		expect(DECLARATION_REMUNERATION_RECAP).toBe(
			"/declaration-remuneration/recapitulatif",
		);
	});

	it("carries `type=correction` on the second-declaration recap", () => {
		expect(DECLARATION_REMUNERATION_RECAP_CORRECTION).toBe(
			"/declaration-remuneration/recapitulatif?type=correction",
		);
	});

	it("builds one href per step", () => {
		expect(remunerationStepHref(1)).toBe("/declaration-remuneration/etape/1");
		expect(remunerationStepHref(6)).toBe("/declaration-remuneration/etape/6");
	});

	it("bounds the funnel at 1..6", () => {
		expect(REMUNERATION_STEP_NUMBERS).toEqual([1, 2, 3, 4, 5, 6]);
		expect(FIRST_REMUNERATION_STEP).toBe(1);
		expect(LAST_REMUNERATION_STEP).toBe(6);
	});

	// `/declaration-remuneration/etape/0` used to be buildable and 404s: the page
	// calls `notFound()` below step 1.
	it("refuses step 0, which has no page", () => {
		expect(toRemunerationStep(0)).toBeNull();
	});

	it("refuses a step past the funnel", () => {
		expect(toRemunerationStep(7)).toBeNull();
	});

	it("accepts every declared step", () => {
		for (const step of REMUNERATION_STEP_NUMBERS) {
			expect(toRemunerationStep(step)).toBe(step);
		}
	});
});

describe("représentation funnel", () => {
	it("spells the entry points", () => {
		expect(DECLARATION_REPRESENTATION).toBe("/declaration-representation");
		expect(DECLARATION_REPRESENTATION_CONFIRMATION).toBe(
			"/declaration-representation/confirmation",
		);
	});

	it("builds one href per step", () => {
		expect(representationStepHref(1)).toBe(
			"/declaration-representation/etape/1",
		);
		expect(representationStepHref(5)).toBe(
			"/declaration-representation/etape/5",
		);
	});

	it("bounds the funnel at 1..5", () => {
		expect(REPRESENTATION_STEP_NUMBERS).toEqual([1, 2, 3, 4, 5]);
		expect(FIRST_REPRESENTATION_STEP).toBe(1);
		expect(LAST_REPRESENTATION_STEP).toBe(5);
	});

	it("narrows an untrusted step", () => {
		expect(toRepresentationStep(3)).toBe(3);
		expect(toRepresentationStep(0)).toBeNull();
		expect(toRepresentationStep(6)).toBeNull();
	});

	// A stored cursor can sit outside the funnel: 0 on an unstarted draft, or a
	// step number left behind by a shorter funnel.
	it("clamps a stored cursor into the funnel", () => {
		expect(clampRepresentationStep(0)).toBe(1);
		expect(clampRepresentationStep(3)).toBe(3);
		expect(clampRepresentationStep(9)).toBe(5);
	});
});
