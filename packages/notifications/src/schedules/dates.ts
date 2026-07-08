// Date helpers for schedule handlers.
//
// Worker code lives outside `~/modules/domain`, so we can't import its
// `getCurrentYear()` helper. Instead we extract the year via
// `Intl.DateTimeFormat` to stay aware of `Europe/Paris` (avoids edge cases
// when a tick lands at 23:00 UTC on Dec 31 — which would be Jan 1 in
// Paris, hence year + 1).

const YEAR_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
	year: "numeric",
	timeZone: "Europe/Paris",
});

export function getCurrentYear(now: Date = new Date()): number {
	return Number(YEAR_FORMATTER.format(now));
}

// Build an ISO 8601 date string at midnight Paris time (close enough for
// display). Used as the `deadline` field in reminder payloads.
export function toIsoDate(year: number, month: number, day: number): string {
	const paddedMonth = String(month).padStart(2, "0");
	const paddedDay = String(day).padStart(2, "0");
	return `${year}-${paddedMonth}-${paddedDay}T00:00:00.000Z`;
}

// First-of-month deadline helpers — mapped 1:1 to the regulatory milestones
// laid out in `docs/parcours-utilisateurs.md`. Centralised here so each
// schedule handler stays declarative.
export const DEADLINES = {
	declarationModification: (year: number) => toIsoDate(year, 6, 1), // 1er juin
	compliancePathChoice: (year: number) => toIsoDate(year, 7, 1), // 1er juillet
	// Round 2 compliance path choice, after a non-conform second declaration.
	compliancePathChoiceAfterSecondDeclaration: (year: number) =>
		toIsoDate(year + 1, 1, 1), // 1er janvier N+1
	jointEvaluationReport: (year: number) => toIsoDate(year, 9, 1), // 1er septembre
	// Round 2 joint evaluation report, after a non-conform second declaration.
	jointEvaluationReportRevised: (year: number) => toIsoDate(year + 1, 3, 1), // 1er mars N+1
	secondDeclaration: (year: number) => toIsoDate(year, 12, 1), // 1er décembre N
	cseOpinionFinal: (year: number) => toIsoDate(year + 1, 3, 1), // 1er mars N+1
	cseOpinionJustifyOct: (year: number) => toIsoDate(year, 10, 1), // 1er octobre
} as const;
