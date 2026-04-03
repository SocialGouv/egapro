import type { CampaignDeadlines } from "../types";

const FRENCH_MONTHS = [
	"janvier",
	"février",
	"mars",
	"avril",
	"mai",
	"juin",
	"juillet",
	"août",
	"septembre",
	"octobre",
	"novembre",
	"décembre",
];

/** Returns the current calendar year (declaration campaign year). */
export function getCurrentYear(): number {
	return new Date().getFullYear();
}

/** Returns the CSE opinion year (next calendar year). */
export function getCseYear(): number {
	return new Date().getFullYear() + 1;
}

/** Returns the declaration modification deadline for a given year. */
export function getDeclarationDeadline(year: number): string {
	return `1\u1D49\u02B3 juin ${year}`;
}

/** Returns the second declaration modification deadline for a given year. */
export function getSecondDeclarationDeadline(year: number): string {
	return `1 décembre ${year}`;
}

/** Formats a date string (YYYY-MM-DD) as a French display date (e.g. "1ᵉʳ juin 2027"). */
export function formatFrenchDate(dateStr: string): string {
	const [yearStr, monthStr, dayStr] = dateStr.split("-");
	const year = Number(yearStr);
	const monthIndex = Number(monthStr) - 1;
	const day = Number(dayStr);
	const month = FRENCH_MONTHS[monthIndex] ?? monthStr;
	const dayLabel = day === 1 ? "1\u1D49\u02B3" : String(day);
	return `${dayLabel} ${month} ${year}`;
}

/** Returns default campaign deadlines for a given year (fallback when no DB config exists). */
export function getDefaultCampaignDeadlines(year: number): CampaignDeadlines {
	return {
		decl1ModificationDeadline: `1\u1D49\u02B3 juin ${year}`,
		decl1JustificationDeadline: `1\u1D49\u02B3 juin ${year}`,
		decl1JointEvaluationDeadline: `1\u1D49\u02B3 août ${year}`,
		decl2ModificationDeadline: `1\u1D49\u02B3 décembre ${year}`,
		decl2JustificationDeadline: `1\u1D49\u02B3 décembre ${year}`,
		decl2JointEvaluationDeadline: `1\u1D49\u02B3 février ${year + 1}`,
	};
}
