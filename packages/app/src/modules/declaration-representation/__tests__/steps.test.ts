import { describe, expect, it } from "vitest";

import {
	getNextStep,
	getNextStepHref,
	getPreviousStepHref,
	getStepDefinition,
	isValidStep,
	PUBLICATION_STEP_NUMBER,
	parseStepParam,
	REPRESENTATION_FUNNEL_ROOT,
	REPRESENTATION_STEPS,
	stepHref,
} from "../steps";
import { Step1ReferencePeriod } from "../steps/Step1ReferencePeriod";
import { Step2Executives } from "../steps/Step2Executives";
import { Step3Members } from "../steps/Step3Members";
import { Step4Publication } from "../steps/Step4Publication";
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

	it("maps each slug to its screen, the placeholder standing in for the pending steps", () => {
		expect(
			Object.fromEntries(
				REPRESENTATION_STEPS.map((step) => [step.slug, step.Component]),
			),
		).toEqual({
			"ecarts-cadres-dirigeants": Step2Executives,
			"ecarts-instances-dirigeantes": Step3Members,
			"informations-de-publication": Step4Publication,
			"periode-de-reference": Step1ReferencePeriod,
			recapitulatif: StepPlaceholder,
		});
	});
});

describe("PUBLICATION_STEP_NUMBER", () => {
	it("points at the publication slot of the funnel", () => {
		expect(PUBLICATION_STEP_NUMBER).toBe(4);
		expect(REPRESENTATION_STEPS[PUBLICATION_STEP_NUMBER - 1]?.slug).toBe(
			"informations-de-publication",
		);
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

describe("parseStepParam", () => {
	it.each([
		["1", 1],
		["5", 5],
		["01", 1],
	])("parses the route param %s into step %i", (raw, expected) => {
		expect(parseStepParam(raw)).toBe(expected);
	});

	it.each([
		"0",
		"6",
		"-1",
		"+1",
		"1.5",
		"1,5",
		"1abc",
		"1e0",
		"0x2",
		" 1",
		"",
		"abc",
	])("rejects the route param %s", (raw) => {
		expect(parseStepParam(raw)).toBeUndefined();
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

	it("resolves the next step number", () => {
		expect(getNextStep(1)).toBe(2);
		expect(getNextStep(PUBLICATION_STEP_NUMBER - 1)).toBe(
			PUBLICATION_STEP_NUMBER,
		);
		expect(getNextStep(TOTAL_REPRESENTATION_STEPS)).toBeUndefined();
	});
});

describe("navigation hrefs — publication step skipped (S12)", () => {
	it("jumps over the publication step when moving forward", () => {
		expect(getNextStep(PUBLICATION_STEP_NUMBER - 1, true)).toBe(
			PUBLICATION_STEP_NUMBER + 1,
		);
		expect(getNextStepHref(PUBLICATION_STEP_NUMBER - 1, true)).toBe(
			`${REPRESENTATION_FUNNEL_ROOT}/etape/${PUBLICATION_STEP_NUMBER + 1}`,
		);
	});

	it("jumps over the publication step when moving backward", () => {
		expect(getPreviousStepHref(PUBLICATION_STEP_NUMBER + 1, true)).toBe(
			`${REPRESENTATION_FUNNEL_ROOT}/etape/${PUBLICATION_STEP_NUMBER - 1}`,
		);
	});

	it("leaves every other transition untouched", () => {
		expect(getNextStep(1, true)).toBe(2);
		expect(getNextStepHref(1, true)).toBe(
			`${REPRESENTATION_FUNNEL_ROOT}/etape/2`,
		);
		expect(getNextStep(2, true)).toBe(3);
		expect(getPreviousStepHref(3, true)).toBe(
			`${REPRESENTATION_FUNNEL_ROOT}/etape/2`,
		);
		expect(getPreviousStepHref(2, true)).toBe(
			`${REPRESENTATION_FUNNEL_ROOT}/etape/1`,
		);
		expect(getPreviousStepHref(1, true)).toBe(REPRESENTATION_FUNNEL_ROOT);
	});

	it("still stops at the end of the funnel", () => {
		expect(getNextStep(TOTAL_REPRESENTATION_STEPS, true)).toBeUndefined();
		expect(getNextStepHref(TOTAL_REPRESENTATION_STEPS, true)).toBeUndefined();
	});

	it("moves forward normally when the publication step is the current one", () => {
		expect(getNextStep(PUBLICATION_STEP_NUMBER, true)).toBe(
			PUBLICATION_STEP_NUMBER + 1,
		);
	});
});
