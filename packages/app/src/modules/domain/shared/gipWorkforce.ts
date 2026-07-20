// A company absent from the GIP file is deemed below the voluntary threshold,
// so the banners display "< 50" rather than a raw missing-data mention.
export const GIP_WORKFORCE_ABSENT_DISPLAY = "< 50";

export function parseGipWorkforce(
	raw: string | number | null | undefined,
): number | null {
	if (raw === null || raw === undefined) return null;
	const value = typeof raw === "number" ? raw : Number.parseFloat(raw);
	return Number.isFinite(value) ? value : null;
}

// A company absent from the GIP file is not subject to the declaration, which every threshold rule expresses as a sub-50 headcount.
export function getObligationWorkforce(gipWorkforce: number | null): number {
	return gipWorkforce ?? 0;
}

// Floored so 99,97 never displays as "100" — thresholds compare the exact value.
export function toDisplayWorkforce(gipWorkforce: number | null): number | null {
	return gipWorkforce === null ? null : Math.floor(gipWorkforce);
}
