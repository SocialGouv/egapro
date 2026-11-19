import type { Sql } from "postgres";
import { describe, expect, it, vi } from "vitest";

import { createAuditJobProbe } from "../auditTrace.js";
import { AUDIT_JOB_DEFINITIONS } from "../definitions.js";

const NOW = new Date("2026-01-02T10:00:00.000Z");
const HOUR = 3_600_000;
const MINUTE = 60_000;

type SqlCall = { text: string; values: readonly unknown[] };

const EXPORT_JOB = AUDIT_JOB_DEFINITIONS[0];
const GIP_JOB = AUDIT_JOB_DEFINITIONS[1];

function recordingSql(respond: (call: SqlCall) => unknown) {
	const calls: SqlCall[] = [];
	const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
		const call = { text: strings.join("?"), values };
		calls.push(call);
		return Promise.resolve(respond(call));
	}) as unknown as Sql;
	return { sql, calls };
}

function ago(ms: number): Date {
	return new Date(NOW.getTime() - ms);
}

function traceSql(trace: {
	lastSuccessAt: Date | null;
	lastFailureAt?: Date | null;
}): Sql {
	return recordingSql(() => [
		{
			lastSuccessAt: trace.lastSuccessAt,
			lastFailureAt: trace.lastFailureAt ?? null,
		},
	]).sql;
}

function probe(
	sql: Sql,
	definition = GIP_JOB,
	options: { corroborate?: (since: Date) => Promise<boolean> } = {},
) {
	return createAuditJobProbe({
		sql,
		definition,
		staleHours: 26,
		secrets: [],
		now: () => NOW,
		...options,
	});
}

describe("audit job probe", () => {
	it("declares itself as a critical job probe", () => {
		expect(probe(traceSql({ lastSuccessAt: ago(HOUR) }))).toMatchObject({
			key: "job-gip-mds-import",
			label: "Import GIP-MDS",
			criticality: "critical",
			kind: "job",
			intervalSeconds: 60,
		});
	});

	it("is operational with a success inside the window and publishes the next run", async () => {
		const result = await probe(
			traceSql({ lastSuccessAt: ago(3 * HOUR) }),
		).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.message).toBeUndefined();
		expect(result.nextExpectedAt?.toISOString()).toBe(
			"2026-01-03T03:00:00.000Z",
		);
	});

	it("is unavailable from the first cycle when the job never succeeded", async () => {
		const result = await probe(traceSql({ lastSuccessAt: null })).probe(
			new AbortController().signal,
		);

		expect(result.status).toBe("unavailable");
		expect(result.message).toContain("en retard");
		expect(result.nextExpectedAt).toBeInstanceOf(Date);
	});

	it("is unavailable when the last success left the window", async () => {
		const result = await probe(
			traceSql({ lastSuccessAt: ago(27 * HOUR), lastFailureAt: ago(2 * HOUR) }),
		).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toContain("dernier succès il y a 27 h");
	});

	it("stays operational when a failure is newer than a success in the window", async () => {
		const result = await probe(
			traceSql({ lastSuccessAt: ago(2 * HOUR), lastFailureAt: ago(HOUR) }),
		).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
	});

	it("reads the action log through the (action, created_at) index", async () => {
		const { sql, calls } = recordingSql(() => [
			{ lastSuccessAt: ago(HOUR), lastFailureAt: null },
		]);

		await probe(sql).probe(new AbortController().signal);

		const call = calls[0];
		expect(call?.text).toContain("WHERE action = ? AND created_at >= ?");
		expect(call?.values[0]).toBe("gip_mds.import");
		expect(call?.values[1]).toEqual(new Date(NOW.getTime() - 26 * HOUR));
	});

	it("is unavailable exactly one minute past the window and operational one before", async () => {
		const inside = await probe(
			traceSql({ lastSuccessAt: ago(26 * HOUR - MINUTE) }),
		).probe(new AbortController().signal);
		const outside = await probe(
			traceSql({ lastSuccessAt: ago(26 * HOUR + MINUTE) }),
		).probe(new AbortController().signal);

		expect(inside.status).toBe("operational");
		expect(outside.status).toBe("unavailable");
	});

	it("disbelieves an export success with no archive behind it", async () => {
		const { sql, calls } = recordingSql((call) =>
			call.text.includes("app_export")
				? [{ lastGeneratedAt: null }]
				: [{ lastSuccessAt: ago(3 * HOUR), lastFailureAt: null }],
		);
		const corroborate = vi.fn(async (since: Date) => {
			const rows = await sql<{ lastGeneratedAt: Date | null }[]>`
				SELECT max(generated_at) AS "lastGeneratedAt" FROM app_export WHERE generated_at >= ${since}
			`;
			return rows[0]?.lastGeneratedAt != null;
		});

		const result = await probe(sql, EXPORT_JOB, { corroborate }).probe(
			new AbortController().signal,
		);

		expect(corroborate).toHaveBeenCalledTimes(1);
		expect(calls.map((call) => call.text)).toEqual([
			expect.stringContaining("audit.action_log"),
			expect.stringContaining("app_export"),
		]);
		expect(result.status).toBe("unavailable");
		expect(result.message).toBe(
			"en retard — succès annoncé sans archive générée",
		);
	});

	it("believes the export when the archive row exists", async () => {
		const { sql } = recordingSql((call) =>
			call.text.includes("app_export")
				? [{ lastGeneratedAt: ago(3 * HOUR) }]
				: [{ lastSuccessAt: ago(3 * HOUR), lastFailureAt: null }],
		);
		const corroborate = vi.fn(async () => true);

		const result = await probe(sql, EXPORT_JOB, { corroborate }).probe(
			new AbortController().signal,
		);

		expect(result.status).toBe("operational");
	});

	it("is degraded when the audit schema was never initialised", async () => {
		const sql = (() =>
			Promise.reject(
				Object.assign(new Error('relation "audit.action_log" does not exist'), {
					code: "42P01",
				}),
			)) as unknown as Sql;

		const result = await probe(sql).probe(new AbortController().signal);

		expect(result.status).toBe("degraded");
		expect(result.message).toBe("schéma de suivi non initialisé");
	});

	it("is unavailable when the database cannot be reached", async () => {
		const sql = (() =>
			Promise.reject(
				Object.assign(new Error("connect ECONNREFUSED 10.0.0.4:5432"), {
					code: "ECONNREFUSED",
				}),
			)) as unknown as Sql;

		const result = await probe(sql).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("connexion refusée");
		expect(result.message).not.toContain("10.0.0.4");
	});

	it("is misconfigured when the credentials are refused", async () => {
		const sql = (() =>
			Promise.reject(
				Object.assign(new Error("password authentication failed"), {
					code: "28P01",
				}),
			)) as unknown as Sql;

		const result = await probe(sql).probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
	});
});
