/**
 * Two kinds of dates live in this app, and they must not share a time zone.
 *
 * A **timestamp** (`createdAt`, `uploadedAt`, `submittedAt`…) is an instant: it
 * reads in the viewer's time zone — `formatShortDate`, `formatLongDate`,
 * `formatShortDateTime`.
 *
 * A **civil date** (a deadline, a campaign bound, a reference period) is a
 * calendar day with no time. It is held as UTC midnight of that day and reads in
 * UTC — `formatCivilShortDate`, `formatCivilLongDate`. Reading it in the viewer's
 * zone shows the day before anywhere west of Greenwich (Guyane, Antilles,
 * Polynésie…), and building it in the server's zone moves it with the server.
 */
export const CIVIL_DATE_TIME_ZONE = "UTC";

/** Build a civil date, held as UTC midnight. `monthIndex` counts from 0, as `Date` does: `civilDate(2026, 5, 1)` is 1 June 2026. */
export function civilDate(year: number, monthIndex: number, day: number): Date {
	return new Date(Date.UTC(year, monthIndex, day));
}
