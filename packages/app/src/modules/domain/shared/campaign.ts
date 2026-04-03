import type { CampaignDeadlines } from "../types";

/** Returns the current calendar year (declaration campaign year). */
export function getCurrentYear(): number {
	return new Date().getFullYear();
}

/** Returns the workforce reference year (previous calendar year, as INSEE publishes N-1 data). */
export function getWorkforceYear(): number {
	return new Date().getFullYear() - 1;
}

/** Returns the declaration modification deadline for a given year. */
export function getDeclarationDeadline(year: number): string {
	return `1\u1D49\u02B3 juin ${year}`;
}

/** Returns the second declaration modification deadline for a given year. */
export function getSecondDeclarationDeadline(year: number): string {
	return `1 décembre ${year}`;
}

/** Returns default campaign deadlines for a given year (fallback when no DB config exists). */
export function getDefaultCampaignDeadlines(year: number): CampaignDeadlines {
	return {
		decl1ModificationDeadline: new Date(year, 5, 1),
		decl1JustificationDeadline: new Date(year, 5, 1),
		decl1JointEvaluationDeadline: new Date(year, 7, 1),
		decl2ModificationDeadline: new Date(year, 11, 1),
		decl2JustificationDeadline: new Date(year, 11, 1),
		decl2JointEvaluationDeadline: new Date(year + 1, 1, 1),
	};
}
