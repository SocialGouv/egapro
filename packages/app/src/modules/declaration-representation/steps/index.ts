import type { ComponentType } from "react";

import type { RepresentationStep } from "~/modules/routes";
import {
	DECLARATION_REPRESENTATION,
	representationStepHref,
	toRepresentationStep,
} from "~/modules/routes";
import type { RepresentationStepSlug } from "../types";
import { REPRESENTATION_STEP_SLUGS } from "../types";
import { Step1ReferencePeriod } from "./Step1ReferencePeriod";
import { Step2Executives } from "./Step2Executives";
import { Step3Members } from "./Step3Members";
import { Step4Publication } from "./Step4Publication";
import { Step5Review } from "./Step5Review";

export type StepDefinition = {
	slug: RepresentationStepSlug;
	title: string;
	Component: ComponentType;
};

export const PUBLICATION_STEP_NUMBER =
	REPRESENTATION_STEP_SLUGS.indexOf("informations-de-publication") + 1;

const STEP_TITLES: Record<RepresentationStepSlug, string> = {
	"periode-de-reference": "Période de référence",
	"ecarts-cadres-dirigeants": "Écarts de représentation - Cadres dirigeants",
	"ecarts-instances-dirigeantes":
		"Écarts de représentation - Instances dirigeantes",
	"informations-de-publication": "Informations de publication",
	recapitulatif: "Récapitulatif",
};

const STEP_COMPONENTS: Record<RepresentationStepSlug, ComponentType> = {
	"periode-de-reference": Step1ReferencePeriod,
	"ecarts-cadres-dirigeants": Step2Executives,
	"ecarts-instances-dirigeantes": Step3Members,
	"informations-de-publication": Step4Publication,
	recapitulatif: Step5Review,
};

export const REPRESENTATION_STEPS: StepDefinition[] =
	REPRESENTATION_STEP_SLUGS.map((slug) => ({
		slug,
		title: STEP_TITLES[slug],
		Component: STEP_COMPONENTS[slug],
	}));

export function isValidStep(step: number): boolean {
	return toRepresentationStep(step) !== null;
}

export function parseStepParam(raw: string): RepresentationStep | undefined {
	if (!/^\d+$/.test(raw)) return undefined;
	return toRepresentationStep(Number.parseInt(raw, 10)) ?? undefined;
}

export function getStepDefinition(step: number): StepDefinition | undefined {
	return isValidStep(step) ? REPRESENTATION_STEPS[step - 1] : undefined;
}

export function getPreviousStepHref(step: number, skipPublicationStep = false) {
	if (step <= 1) return DECLARATION_REPRESENTATION;
	const candidate = step - 1;
	const previous =
		skipPublicationStep && candidate === PUBLICATION_STEP_NUMBER
			? candidate - 1
			: candidate;
	const target = toRepresentationStep(previous);
	return target === null
		? DECLARATION_REPRESENTATION
		: representationStepHref(target);
}

export function getNextStep(
	step: number,
	skipPublicationStep = false,
): RepresentationStep | undefined {
	const candidate = step + 1;
	const next =
		skipPublicationStep && candidate === PUBLICATION_STEP_NUMBER
			? candidate + 1
			: candidate;
	return toRepresentationStep(next) ?? undefined;
}

export function getNextStepHref(step: number, skipPublicationStep = false) {
	const next = getNextStep(step, skipPublicationStep);
	return next === undefined ? undefined : representationStepHref(next);
}
