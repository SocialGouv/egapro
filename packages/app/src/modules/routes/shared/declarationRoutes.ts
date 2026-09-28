import { route } from "./routeContract";
import { clampStep, lastStep, toStep } from "./stepDomain";

export const DECLARATION_REMUNERATION = route("/declaration-remuneration");
export const DECLARATION_REMUNERATION_RECAP = route(
	"/declaration-remuneration/recapitulatif",
);

// `type` is the one query this funnel reads, unlike the `?siren=` that used to
// ride along on every my-space link and that no page ever looked at.
export const DECLARATION_REMUNERATION_RECAP_CORRECTION = route(
	`${DECLARATION_REMUNERATION_RECAP}?type=correction` as const,
);

// `etape/0` is absent on purpose: the page `notFound()`s below 1, and the
// introduction it would stand for is `DECLARATION_REMUNERATION` itself.
export const REMUNERATION_STEP_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

export type RemunerationStep = (typeof REMUNERATION_STEP_NUMBERS)[number];

const REMUNERATION_STEP_ROUTES = {
	1: route("/declaration-remuneration/etape/1"),
	2: route("/declaration-remuneration/etape/2"),
	3: route("/declaration-remuneration/etape/3"),
	4: route("/declaration-remuneration/etape/4"),
	5: route("/declaration-remuneration/etape/5"),
	6: route("/declaration-remuneration/etape/6"),
} as const;

export type RemunerationStepRoute =
	(typeof REMUNERATION_STEP_ROUTES)[RemunerationStep];

export function toRemunerationStep(step: number): RemunerationStep | null {
	return toStep(REMUNERATION_STEP_NUMBERS, step);
}

export function remunerationStepHref(
	step: RemunerationStep,
): RemunerationStepRoute {
	return REMUNERATION_STEP_ROUTES[step];
}

export const FIRST_REMUNERATION_STEP = REMUNERATION_STEP_NUMBERS[0];
export const LAST_REMUNERATION_STEP = lastStep(REMUNERATION_STEP_NUMBERS);

export const DECLARATION_REPRESENTATION = route("/declaration-representation");
export const DECLARATION_REPRESENTATION_CONFIRMATION = route(
	"/declaration-representation/confirmation",
);

export const REPRESENTATION_STEP_NUMBERS = [1, 2, 3, 4, 5] as const;

export type RepresentationStep = (typeof REPRESENTATION_STEP_NUMBERS)[number];

const REPRESENTATION_STEP_ROUTES = {
	1: route("/declaration-representation/etape/1"),
	2: route("/declaration-representation/etape/2"),
	3: route("/declaration-representation/etape/3"),
	4: route("/declaration-representation/etape/4"),
	5: route("/declaration-representation/etape/5"),
} as const;

export type RepresentationStepRoute =
	(typeof REPRESENTATION_STEP_ROUTES)[RepresentationStep];

export function toRepresentationStep(step: number): RepresentationStep | null {
	return toStep(REPRESENTATION_STEP_NUMBERS, step);
}

export function representationStepHref(
	step: RepresentationStep,
): RepresentationStepRoute {
	return REPRESENTATION_STEP_ROUTES[step];
}

export function clampRepresentationStep(step: number): RepresentationStep {
	return clampStep(REPRESENTATION_STEP_NUMBERS, step);
}

export const FIRST_REPRESENTATION_STEP = REPRESENTATION_STEP_NUMBERS[0];
export const LAST_REPRESENTATION_STEP = lastStep(REPRESENTATION_STEP_NUMBERS);
