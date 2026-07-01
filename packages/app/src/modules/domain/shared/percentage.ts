export function proportionOf(count: number, total: number): number {
	return total === 0 ? 0 : count / total;
}

export function percentageOf(count: number, total: number): number {
	return total === 0 ? 0 : (count / total) * 100;
}
