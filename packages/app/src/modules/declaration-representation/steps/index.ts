import type { ComponentType } from "react";

import type { RepresentationStepSlug } from "../types";
import {
	REPRESENTATION_STEP_SLUGS,
	TOTAL_REPRESENTATION_STEPS,
} from "../types";
import { Step1ReferencePeriod } from "./Step1ReferencePeriod";
import { Step2Executives } from "./Step2Executives";
import { Step3Members } from "./Step3Members";
import { Step4Publication } from "./Step4Publication";
import { StepPlaceholder } from "./StepPlaceholder";

export type StepDefinition = {
	slug: RepresentationStepSlug;
	title: string;
	Component: ComponentType;
};

export const REPRESENTATION_FUNNEL_ROOT = "/declaration-representation";

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
	recapitulatif: StepPlaceholder,
};

export const REPRESENTATION_STEPS: StepDefinition[] =
	REPRESENTATION_STEP_SLUGS.map((slug) => ({
		slug,
		title: STEP_TITLES[slug],
		Component: STEP_COMPONENTS[slug],
	}));

export function isValidStep(step: number): boolean {
	return (
		Number.isInteger(step) && step >= 1 && step <= TOTAL_REPRESENTATION_STEPS
	);
}

export function parseStepParam(raw: string): number | undefined {
	if (!/^\d+$/.test(raw)) return undefined;
	const step = Number.parseInt(raw, 10);
	return isValidStep(step) ? step : undefined;
}

export function getStepDefinition(step: number): StepDefinition | undefined {
	return isValidStep(step) ? REPRESENTATION_STEPS[step - 1] : undefined;
}

export function stepHref(step: number): string {
	return `${REPRESENTATION_FUNNEL_ROOT}/etape/${step}`;
}

export function getPreviousStepHref(
	step: number,
	skipPublicationStep = false,
): string {
	if (step <= 1) return REPRESENTATION_FUNNEL_ROOT;
	const candidate = step - 1;
	const previous =
		skipPublicationStep && candidate === PUBLICATION_STEP_NUMBER
			? candidate - 1
			: candidate;
	return previous < 1 ? REPRESENTATION_FUNNEL_ROOT : stepHref(previous);
}

export function getNextStep(
	step: number,
	skipPublicationStep = false,
): number | undefined {
	const candidate = step + 1;
	const next =
		skipPublicationStep && candidate === PUBLICATION_STEP_NUMBER
			? candidate + 1
			: candidate;
	return next > TOTAL_REPRESENTATION_STEPS ? undefined : next;
}

export function getNextStepHref(
	step: number,
	skipPublicationStep = false,
): string | undefined {
	const next = getNextStep(step, skipPublicationStep);
	return next === undefined ? undefined : stepHref(next);
}
