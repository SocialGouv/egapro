export function startTimer(): () => number {
	const startedAt = performance.now();
	return () => Math.round(performance.now() - startedAt);
}
