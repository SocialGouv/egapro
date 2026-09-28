// The only door between a `number` — a URL segment, a stored round, a draft
// cursor — and the closed list of steps a funnel has a page for.
export function toStep<S extends number>(
	steps: readonly S[],
	step: number,
): S | null {
	return steps.includes(step as S) ? (step as S) : null;
}

export function lastStep<S extends number>(steps: readonly [S, ...S[]]): S {
	return steps[steps.length - 1] ?? steps[0];
}

// Callers used to write `Math.max(current ?? 1, 1)`, which guarded the low end
// and let the high end build an href to a step that has no page.
export function clampStep<S extends number>(
	steps: readonly [S, ...S[]],
	step: number,
): S {
	const first = steps[0];
	const last = steps[steps.length - 1] ?? first;
	if (step <= first) return first;
	if (step >= last) return last;
	return toStep(steps, step) ?? first;
}
