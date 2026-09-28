/**
 * Integration test for the audit wiring of
 * `/api/public/referents-egalite-professionnelle` (issue #3764).
 *
 * Why an integration test and not a unit test: the unit test mocks
 * `~/server/audit/log`, so it proves the wrapper is called but not that the
 * row survives the drizzle insert. Only a real Postgres exercises the
 * `audit.action_log` column types (jsonb metadata, varchar(20) category) and
 * the category resolved from `AUDIT_ACTION_CATEGORIES` at insert time.
 */

import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { db } from "~/server/db";
import { referents } from "~/server/db/schema";

const REGION_CODE = "11";
const COUNTY_CODE = "75";

type AuditRow = {
	action: string;
	category: string;
	status: string;
	metadata: { format?: string } | null;
	ip_address: string | null;
	user_agent: string | null;
	duration_ms: number | null;
};

describe("audited referents route (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM audit.action_log`;
		await sql`DELETE FROM app_referent`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM audit.action_log`;
		await sql`DELETE FROM app_referent`;
		await db.insert(referents).values({
			region: REGION_CODE,
			county: COUNTY_CODE,
			name: "Référent démo",
			type: "email",
			value: "referent@example.fr",
			principal: true,
		});
	});

	async function readAuditRows(): Promise<AuditRow[]> {
		return sql<AuditRow[]>`
			SELECT action, category, status, metadata, ip_address, user_agent, duration_ms
			FROM audit.action_log
			ORDER BY created_at ASC
		`;
	}

	/**
	 * `withAuditedRoute` fires the insert without awaiting it (audit logging
	 * must never block the response), so the row can land a tick after the
	 * handler resolves. Poll instead of asserting on the first read.
	 */
	async function waitForAuditRows(expected: number): Promise<AuditRow[]> {
		const deadline = Date.now() + 5_000;
		let rows = await readAuditRows();
		while (rows.length < expected && Date.now() < deadline) {
			await new Promise((resolve) => setTimeout(resolve, 50));
			rows = await readAuditRows();
		}
		return rows;
	}

	async function callRoute(url: string): Promise<Response> {
		const { GET } = await import(
			"~/app/api/public/referents-egalite-professionnelle/route"
		);
		return GET(
			new Request(url, {
				headers: {
					"x-forwarded-for": "203.0.113.7",
					"user-agent": "IntegrationAgent",
				},
			}),
		);
	}

	it("writes one public_referents.search row for a JSON read", async () => {
		const response = await callRoute(
			"http://localhost/api/public/referents-egalite-professionnelle",
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toHaveLength(1);

		const rows = await waitForAuditRows(1);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			action: AUDIT_ACTIONS.PUBLIC_REFERENT_SEARCH,
			category: "public_search",
			status: "success",
			ip_address: "203.0.113.7",
			user_agent: "IntegrationAgent",
		});
		expect(rows[0]?.metadata).toEqual({ format: "json" });
		expect(rows[0]?.duration_ms).toBeGreaterThanOrEqual(0);
	});

	it("records the csv format in the persisted metadata", async () => {
		const response = await callRoute(
			"http://localhost/api/public/referents-egalite-professionnelle?format=csv",
		);
		expect(response.status).toBe(200);

		const rows = await waitForAuditRows(1);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.metadata).toEqual({ format: "csv" });
	});
});
