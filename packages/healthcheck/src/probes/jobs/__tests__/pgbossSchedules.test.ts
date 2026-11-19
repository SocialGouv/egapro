import type { Sql } from "postgres";
import { describe, expect, it } from "vitest";

import {
	createReminderJobProbe,
	REMINDER_SCHEDULES,
} from "../pgbossSchedules.js";

const NOW = new Date("2026-01-02T10:00:00.000Z");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const DAILY = REMINDER_SCHEDULES[0];
const YEARLY = REMINDER_SCHEDULES.find(
	(schedule) => schedule.queue === "reminder-cycle-opening-info",
) as (typeof REMINDER_SCHEDULES)[number];

function fakeSql(respond: (text: string) => unknown): Sql {
	return ((strings: TemplateStringsArray) =>
		Promise.resolve(respond(strings.join("?")))) as unknown as Sql;
}

function jobSql(input: {
	cron?: string | null;
	timeZone?: string | null;
	lastCompletedAt: Date | null;
	lastSuccessAt?: Date | null;
	lastFailureAt?: Date | null;
}): Sql {
	return fakeSql((text) => {
		if (text.includes("pgboss.schedule")) {
			return input.cron
				? [{ cron: input.cron, timeZone: input.timeZone ?? "Europe/Paris" }]
				: [];
		}
		return [
			{
				lastCompletedAt: input.lastCompletedAt,
				lastSuccessAt: input.lastSuccessAt ?? input.lastCompletedAt,
				lastFailureAt: input.lastFailureAt ?? null,
			},
		];
	});
}

function probe(sql: Sql | null, schedule = DAILY) {
	return createReminderJobProbe({
		sql,
		schedule,
		staleHours: 26,
		secrets: [],
		now: () => NOW,
	});
}

function ago(ms: number): Date {
	return new Date(NOW.getTime() - ms);
}

describe("reminder job probe", () => {
	it("declares itself as an important job probe", () => {
		expect(probe(jobSql({ lastCompletedAt: null }))).toMatchObject({
			key: "job-reminder-deadline-daily-tick",
			label: "Relances des échéances déclaratives",
			criticality: "important",
			kind: "job",
			intervalSeconds: 60,
		});
	});

	it("is operational with a completion inside the window and publishes the next run", async () => {
		const result = await probe(
			jobSql({
				cron: "0 8 * * *",
				timeZone: "Europe/Paris",
				lastCompletedAt: ago(3 * HOUR),
			}),
		).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.nextExpectedAt?.toISOString()).toBe(
			"2026-01-03T07:00:00.000Z",
		);
		expect(result.lastSuccessAt?.toISOString()).toBe(
			ago(3 * HOUR).toISOString(),
		);
	});

	it("publishes the last completed and last failed runs for the screen", async () => {
		const result = await probe(
			jobSql({
				cron: "0 8 * * *",
				lastCompletedAt: ago(5 * HOUR),
				lastSuccessAt: ago(30 * HOUR),
				lastFailureAt: ago(2 * HOUR),
			}),
		).probe(new AbortController().signal);

		expect(result.lastSuccessAt?.toISOString()).toBe(
			ago(30 * HOUR).toISOString(),
		);
		expect(result.lastFailureAt?.toISOString()).toBe(
			ago(2 * HOUR).toISOString(),
		);
	});

	it("is unavailable when the queue never completed a job", async () => {
		const result = await probe(
			jobSql({ cron: "0 8 * * *", lastCompletedAt: null }),
		).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toContain("en retard");
	});

	it("is unavailable when pg-boss does not know the schedule", async () => {
		const result = await probe(
			jobSql({ cron: null, lastCompletedAt: ago(HOUR) }),
		).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("en retard — planification absente de pg-boss");
		expect(result.nextExpectedAt).toBeUndefined();
	});

	it("does not turn a yearly schedule red the day after it ran", async () => {
		const result = await probe(
			jobSql({
				cron: "0 8 1 3 *",
				lastCompletedAt: ago(10 * DAY),
			}),
			YEARLY,
		).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.nextExpectedAt?.toISOString()).toBe(
			"2026-03-01T07:00:00.000Z",
		);
	});

	it("is unavailable one year after the last completion of a yearly schedule", async () => {
		const result = await probe(
			jobSql({ cron: "0 8 1 3 *", lastCompletedAt: ago(366 * DAY) }),
			YEARLY,
		).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
	});

	it("is degraded when the pg-boss schema was never initialised", async () => {
		const sql = fakeSql(() => {
			throw Object.assign(
				new Error('relation "pgboss.schedule" does not exist'),
				{
					code: "42P01",
				},
			);
		});

		const result = await probe(sql).probe(new AbortController().signal);

		expect(result.status).toBe("degraded");
		expect(result.message).toBe("schéma de suivi non initialisé");
	});

	it("is operational with 'non configuré' without a queue database", async () => {
		const result = await probe(null).probe(new AbortController().signal);

		expect(result).toEqual({
			status: "operational",
			latencyMs: 0,
			message: "non configuré",
		});
	});
});
