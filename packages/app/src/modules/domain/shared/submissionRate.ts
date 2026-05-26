export function roundOneDecimal(value: number): number {
	return Math.round(value * 10) / 10;
}

export function computeRate(submitted: number, obligated: number): number {
	if (obligated === 0) return 0;
	return roundOneDecimal((submitted / obligated) * 100);
}

export function formatPointsAbs(points: number): string {
	const rounded = roundOneDecimal(Math.abs(points));
	return rounded.toFixed(1).replace(".", ",");
}
