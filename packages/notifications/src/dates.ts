// Pure date helpers shared by the eligibility and schedule layers.
//
// Worker code lives outside `~/modules/domain`, so the defaults below mirror
// `getDefaultCampaignDeadlines` (domain `shared/campaign.ts`) — the worker
// falls back to the exact dates the app uses when `app_campaign_deadline` has
// no row for the year.

const YEAR_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
	year: "numeric",
	timeZone: "Europe/Paris",
});

export function getCurrentYear(now: Date = new Date()): number {
	return Number(YEAR_FORMATTER.format(now));
}

// Today's civil date ("YYYY-MM-DD") in Europe/Paris. `sv-SE` renders ISO
// dates; the explicit timeZone avoids a day flip when the container runs in
// UTC (Paris is UTC+1/+2).
export function getParisCivilDate(now: Date = new Date()): string {
	return now.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

// ISO 8601 date string at UTC midnight (the `deadline` field of reminders).
export function toIsoDate(year: number, month: number, day: number): string {
	const paddedMonth = String(month).padStart(2, "0");
	const paddedDay = String(day).padStart(2, "0");
	return `${year}-${paddedMonth}-${paddedDay}T00:00:00.000Z`;
}

// Civil date ("YYYY-MM-DD") N days before an ISO deadline. Anchored on UTC
// midnight so the subtraction is DST-immune (no local time component).
export function civilDateBefore(deadlineIso: string, days: number): string {
	const d = new Date(deadlineIso);
	d.setUTCDate(d.getUTCDate() - days);
	return d.toISOString().slice(0, 10);
}

// The deadlines a reminder needs, as ISO strings. Mirror of the app's
// `CampaignDeadlines` for the milestones we send on. `pathChoiceRound1` is
// worker-only (the app's domain models a single `pathChoiceDeadline`, used
// here for round 2).
export type ReminderDeadlines = {
	decl1Modification: string; // 1er juin
	decl1JointEvaluation: string; // 1er août
	decl2Modification: string; // 1er décembre
	decl2JointEvaluation: string; // 1er février N+1
	pathChoiceRound1: string; // 1er juillet (round 1, not admin-configurable)
	pathChoiceRound2: string; // 1er janvier N+1 (domain `pathChoiceDeadline`)
};

// Fallback deadlines, identical to `getDefaultCampaignDeadlines(year)` in the
// domain. Used when `app_campaign_deadline` has no row for the year.
export function getDefaultReminderDeadlines(year: number): ReminderDeadlines {
	return {
		decl1Modification: toIsoDate(year, 6, 1),
		decl1JointEvaluation: toIsoDate(year, 8, 1),
		decl2Modification: toIsoDate(year, 12, 1),
		decl2JointEvaluation: toIsoDate(year + 1, 2, 1),
		pathChoiceRound1: toIsoDate(year, 7, 1),
		pathChoiceRound2: toIsoDate(year + 1, 1, 1),
	};
}

// CSE-opinion reminder deadlines. The unified CSE reminder displays no
// deadline, so these only satisfy the payload shape / dedup — kept fixed.
export const CSE_DEADLINES = {
	justifyOct: (year: number) => toIsoDate(year, 10, 1), // 1er octobre
	final: (year: number) => toIsoDate(year + 1, 3, 1), // 1er mars N+1
} as const;
