import { describe, expect, it } from "vitest";

import {
	cronPeriodMs,
	evaluateFreshness,
	nextExpectedAt,
	stalenessWindowMs,
} from "../freshness.js";

const HOUR = 3_600_000;
const MINUTE = 60_000;
const NOW = new Date("2026-01-02T10:00:00.000Z");
const WINDOW = stalenessWindowMs(26, cronPeriodMs("0 3 * * *", "UTC", NOW));

function ago(ms: number): Date {
	return new Date(NOW.getTime() - ms);
}

describe("stalenessWindowMs", () => {
	it("keeps 26 h as the floor of a daily job", () => {
		expect(stalenessWindowMs(26, 24 * HOUR)).toBe(26 * HOUR);
	});

	it("widens to the cron period for a less frequent job", () => {
		const monthly = cronPeriodMs("0 8 1 * *", "Europe/Paris", NOW);

		expect(stalenessWindowMs(26, monthly)).toBe(monthly);
	});
});

describe("cronPeriodMs", () => {
	it("reads a daily cron as 24 h, even at the exact firing instant", () => {
		const atOccurrence = new Date("2026-01-02T03:00:00.000Z");

		expect(cronPeriodMs("0 3 * * *", "UTC", atOccurrence)).toBe(24 * HOUR);
	});

	it("reads a yearly cron as a year", () => {
		expect(cronPeriodMs("0 8 1 3 *", "Europe/Paris", NOW)).toBe(
			365 * 24 * HOUR,
		);
	});
});

describe("nextExpectedAt", () => {
	it("returns the next run after the check, in the cron's time zone", () => {
		expect(nextExpectedAt("0 8 * * *", "Europe/Paris", NOW).toISOString()).toBe(
			"2026-01-03T07:00:00.000Z",
		);
	});

	it("returns the next day when today's run already happened", () => {
		expect(nextExpectedAt("0 3 * * *", "UTC", NOW).toISOString()).toBe(
			"2026-01-03T03:00:00.000Z",
		);
	});
});

describe("evaluateFreshness", () => {
	it("is unavailable when the job never recorded a success", () => {
		const verdict = evaluateFreshness({
			now: NOW,
			windowMs: WINDOW,
			lastSuccessAt: null,
		});

		expect(verdict.status).toBe("unavailable");
		expect(verdict.message).toContain("en retard");
		expect(verdict.message).toContain("aucun succès");
	});

	it("stays operational exactly one minute inside the window", () => {
		const verdict = evaluateFreshness({
			now: NOW,
			windowMs: WINDOW,
			lastSuccessAt: ago(WINDOW - MINUTE),
		});

		expect(verdict.status).toBe("operational");
		expect(verdict.message).toBeUndefined();
	});

	it("is unavailable exactly one minute past the window", () => {
		const verdict = evaluateFreshness({
			now: NOW,
			windowMs: WINDOW,
			lastSuccessAt: ago(WINDOW + MINUTE),
		});

		expect(verdict.status).toBe("unavailable");
		expect(verdict.message).toBe("en retard — dernier succès il y a 26 h");
	});

	it("keeps a failure newer than the last success out of the verdict", () => {
		const verdict = evaluateFreshness({
			now: NOW,
			windowMs: WINDOW,
			lastSuccessAt: ago(2 * HOUR),
			lastFailureAt: ago(HOUR),
		});

		expect(verdict.status).toBe("operational");
	});

	it("still reports the last failure when the success left the window", () => {
		const verdict = evaluateFreshness({
			now: NOW,
			windowMs: WINDOW,
			lastSuccessAt: ago(27 * HOUR),
			lastFailureAt: ago(2 * HOUR),
		});

		expect(verdict.status).toBe("unavailable");
		expect(verdict.message).toBe(
			"en retard — dernier succès il y a 27 h, dernier échec il y a 2 h",
		);
	});
});
