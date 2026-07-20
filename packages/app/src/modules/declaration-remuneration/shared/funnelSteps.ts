export const INDICATOR_G_STEP = 5;

const ALL_STEPS = [1, 2, 3, 4, 5, 6] as const;

export function stepHref(step: number): string {
	return `/declaration-remuneration/etape/${step}`;
}

export function getFunnelSteps(indicatorGRequired: boolean): number[] {
	return indicatorGRequired
		? [...ALL_STEPS]
		: ALL_STEPS.filter((step) => step !== INDICATOR_G_STEP);
}

export function getNextStepHref(
	currentStep: number,
	indicatorGRequired: boolean,
): string | undefined {
	const steps = getFunnelSteps(indicatorGRequired);
	const next = steps[steps.indexOf(currentStep) + 1];
	return next === undefined ? undefined : stepHref(next);
}

export function getPreviousStepHref(
	currentStep: number,
	indicatorGRequired: boolean,
): string | undefined {
	const steps = getFunnelSteps(indicatorGRequired);
	const index = steps.indexOf(currentStep);
	const previous = index <= 0 ? undefined : steps[index - 1];
	return previous === undefined ? undefined : stepHref(previous);
}
