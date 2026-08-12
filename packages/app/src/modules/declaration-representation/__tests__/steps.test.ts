import { describe, expect, it } from "vitest";

import {
	getNextStepHref,
	getPreviousStepHref,
	getStepDefinition,
	isValidStep,
	REPRESENTATION_FUNNEL_ROOT,
	REPRESENTATION_STEPS,
	stepHref,
} from "../steps";
import { StepPlaceholder } from "../steps/StepPlaceholder";
import {
	REPRESENTATION_STEP_SLUGS,
	TOTAL_REPRESENTATION_STEPS,
} from "../types";

describe("REPRESENTATION_STEPS", () => {
	it("declares the five funnel steps in order", () => {
		expect(REPRESENTATION_STEPS).toHaveLength(TOTAL_REPRESENTATION_STEPS);
		expect(REPRESENTATION_STEPS.map((step) => step.slug)).toEqual([
			...REPRESENTATION_STEP_SLUGS,
		]);
		expect(REPRESENTATION_STEPS.map((step) => step.title)).toEqual([
			"Période de référence",
			"Écarts de représentation - Cadres dirigeants",
			"Écarts de représentation - Instances dirigeantes",
			"Informations de publication",
			"Récapitulatif",
		]);
	});

	it("renders every step with the placeholder until the step tickets land", () => {
		for (const step of REPRESENTATION_STEPS) {
			expect(step.Component).toBe(StepPlaceholder);
		}
	});
});

describe("isValidStep", () => {
	it.each([1, 2, 3, 4, 5])("accepts step %i", (step) => {
		expect(isValidStep(step)).toBe(true);
	});

	it.each([0, -1, 6, 1.5, Number.NaN])("rejects %s", (step) => {
		expect(isValidStep(step)).toBe(false);
	});
});

describe("getStepDefinition", () => {
	it("returns the definition matching the 1-based step number", () => {
		expect(getStepDefinition(1)?.slug).toBe("periode-de-reference");
		expect(getStepDefinition(5)?.slug).toBe("recapitulatif");
	});

	it("returns undefined outside the funnel range", () => {
		expect(getStepDefinition(0)).toBeUndefined();
		expect(getStepDefinition(6)).toBeUndefined();
		expect(getStepDefinition(Number.NaN)).toBeUndefined();
	});
});

describe("navigation hrefs", () => {
	it("builds the step href from the funnel root", () => {
		expect(stepHref(3)).toBe(`${REPRESENTATION_FUNNEL_ROOT}/etape/3`);
	});

	it("goes back to the previous step", () => {
		expect(getPreviousStepHref(3)).toBe(
			`${REPRESENTATION_FUNNEL_ROOT}/etape/2`,
		);
	});

	it("goes back to the funnel root from the first step", () => {
		expect(getPreviousStepHref(1)).toBe(REPRESENTATION_FUNNEL_ROOT);
	});

	it("goes forward to the next step", () => {
		expect(getNextStepHref(1)).toBe(`${REPRESENTATION_FUNNEL_ROOT}/etape/2`);
		expect(getNextStepHref(4)).toBe(`${REPRESENTATION_FUNNEL_ROOT}/etape/5`);
	});

	it("has no next step on the last step", () => {
		expect(getNextStepHref(TOTAL_REPRESENTATION_STEPS)).toBeUndefined();
	});
});
