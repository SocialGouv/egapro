import type { ComponentType } from "react";

import type { RepresentationStepSlug } from "../types";
import {
	REPRESENTATION_STEP_SLUGS,
	TOTAL_REPRESENTATION_STEPS,
} from "../types";
import { StepPlaceholder } from "./StepPlaceholder";

export type StepDefinition = {
	slug: RepresentationStepSlug;
	title: string;
	Component: ComponentType;
};

export const REPRESENTATION_FUNNEL_ROOT = "/declaration-representation";

const STEP_TITLES: Record<RepresentationStepSlug, string> = {
	"periode-de-reference": "Période de référence",
	"ecarts-cadres-dirigeants": "Écarts de représentation - Cadres dirigeants",
	"ecarts-instances-dirigeantes":
		"Écarts de représentation - Instances dirigeantes",
	"informations-de-publication": "Informations de publication",
	recapitulatif: "Récapitulatif",
};

export const REPRESENTATION_STEPS: StepDefinition[] =
	REPRESENTATION_STEP_SLUGS.map((slug) => ({
		slug,
		title: STEP_TITLES[slug],
		Component: StepPlaceholder,
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

export function getPreviousStepHref(step: number): string {
	return step <= 1 ? REPRESENTATION_FUNNEL_ROOT : stepHref(step - 1);
}

export function getNextStepHref(step: number): string | undefined {
	return step >= TOTAL_REPRESENTATION_STEPS ? undefined : stepHref(step + 1);
}
