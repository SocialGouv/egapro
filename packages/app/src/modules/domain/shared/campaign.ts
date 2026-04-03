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

/** Returns default campaign deadlines as ISO dates for a given year (fallback when no DB config exists). */
export function getDefaultCampaignDeadlines(year: number): CampaignDeadlines {
	return {
		decl1ModificationDeadline: `${year}-06-01`,
		decl1JustificationDeadline: `${year}-06-01`,
		decl1JointEvaluationDeadline: `${year}-08-01`,
		decl2ModificationDeadline: `${year}-12-01`,
		decl2JustificationDeadline: `${year}-12-01`,
		decl2JointEvaluationDeadline: `${year + 1}-02-01`,
	};
}
