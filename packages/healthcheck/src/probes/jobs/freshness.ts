import { CronExpressionParser } from "cron-parser";

import type { ProbeStatus } from "../types.js";

const HOUR_MS = 3_600_000;

export type FreshnessVerdict = {
	status: ProbeStatus;
	message?: string;
};

export type FreshnessInput = {
	now: Date;
	windowMs: number;
	lastSuccessAt: Date | null;
	lastFailureAt?: Date | null;
};

/**
 * Window used to decide a scheduled job is late.
 *
 * `staleHours` is a floor, not the value: it is 24 h plus 2 h of margin to
 * absorb a scheduler delay. A cron that fires less often than once a day gets
 * its own period instead, otherwise a yearly job would be red for eleven
 * months while running exactly on schedule.
 */
export function stalenessWindowMs(
	staleHours: number,
	cronPeriodMs: number,
): number {
	return Math.max(staleHours * HOUR_MS, cronPeriodMs);
}

/** Next occurrence strictly after `now`, in the cron's own time zone. */
export function nextExpectedAt(
	cron: string,
	timeZone: string,
	now: Date,
): Date {
	return CronExpressionParser.parse(cron, { currentDate: now, tz: timeZone })
		.next()
		.toDate();
}

/**
 * Gap between two consecutive occurrences.
 *
 * Two `next()` calls on the same expression, never `next()` against `prev()`:
 * at the exact instant an occurrence fires, `prev()` returns the one before it
 * and the interval would read as two periods (48 h instead of 24 h for a daily
 * cron), silently widening the window for one tick.
 */
export function cronPeriodMs(
	cron: string,
	timeZone: string,
	now: Date,
): number {
	const occurrences = CronExpressionParser.parse(cron, {
		currentDate: now,
		tz: timeZone,
	});
	const first = occurrences.next().toDate();
	const second = occurrences.next().toDate();
	return second.getTime() - first.getTime();
}

/**
 * Freshness verdict for a job probe.
 *
 * Only the last success decides the status. A failure newer than that success
 * is not an outage as long as a success landed inside the window — it is shown
 * on its own line by the back-office, not turned into a red probe.
 */
export function evaluateFreshness({
	now,
	windowMs,
	lastSuccessAt,
	lastFailureAt = null,
}: FreshnessInput): FreshnessVerdict {
	if (!lastSuccessAt) {
		return {
			status: "unavailable",
			message: withLastFailure(
				"en retard — aucun succès enregistré",
				now,
				lastFailureAt,
			),
		};
	}

	const ageMs = now.getTime() - lastSuccessAt.getTime();
	if (ageMs > windowMs) {
		return {
			status: "unavailable",
			message: withLastFailure(
				`en retard — dernier succès il y a ${formatDuration(ageMs)}`,
				now,
				lastFailureAt,
			),
		};
	}

	return { status: "operational" };
}

function withLastFailure(
	message: string,
	now: Date,
	lastFailureAt: Date | null,
): string {
	if (!lastFailureAt) return message;
	const ageMs = now.getTime() - lastFailureAt.getTime();
	return `${message}, dernier échec il y a ${formatDuration(ageMs)}`;
}

export function formatDuration(ms: number): string {
	const minutes = Math.floor(ms / 60_000);
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 48) return `${hours} h`;
	return `${Math.floor(hours / 24)} j`;
}
