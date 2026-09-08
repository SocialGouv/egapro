import type { RemunerationStep, RemunerationStepRoute } from "~/modules/routes";
import {
	REMUNERATION_STEP_NUMBERS,
	remunerationStepHref,
	toRemunerationStep,
} from "~/modules/routes";

export const INDICATOR_G_STEP: RemunerationStep = 5;

export function getFunnelSteps(
	indicatorGRequired: boolean,
): RemunerationStep[] {
	return indicatorGRequired
		? [...REMUNERATION_STEP_NUMBERS]
		: REMUNERATION_STEP_NUMBERS.filter((step) => step !== INDICATOR_G_STEP);
}

export function getNextStepHref(
	currentStep: number,
	indicatorGRequired: boolean,
): RemunerationStepRoute | undefined {
	const step = toRemunerationStep(currentStep);
	if (step === null) return undefined;
	const steps = getFunnelSteps(indicatorGRequired);
	const index = steps.indexOf(step);
	const next = index < 0 ? undefined : steps[index + 1];
	return next === undefined ? undefined : remunerationStepHref(next);
}

export function getPreviousStepHref(
	currentStep: number,
	indicatorGRequired: boolean,
): RemunerationStepRoute | undefined {
	const step = toRemunerationStep(currentStep);
	if (step === null) return undefined;
	const steps = getFunnelSteps(indicatorGRequired);
	const index = steps.indexOf(step);
	const previous = index <= 0 ? undefined : steps[index - 1];
	return previous === undefined ? undefined : remunerationStepHref(previous);
}
