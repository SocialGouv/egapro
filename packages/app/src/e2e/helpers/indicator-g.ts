/** Steps the funnel presents: the indicator G categories step is dropped when not owed. */
function funnelStepCount(indicatorGRequired: boolean): number {
	return indicatorGRequired ? 6 : 5;
}

/** Stepper label of the review step, always the last one of the funnel. */
export function recapStepperLabel(indicatorGRequired: boolean): string {
	const total = funnelStepCount(indicatorGRequired);
	return `Étape ${total} sur ${total}`;
}
