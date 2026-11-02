/**
 * Integration test for the stdout-only audit policy of
 * `/api/public/referents-egalite-professionnelle`.
 *
 * Route unit tests mock `~/server/audit/log`; this test exercises the real
 * handler and Postgres to ensure a public read leaves no audit row.
 */

import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { db } from "~/server/db";
import { referents } from "~/server/db/schema";

const REGION_CODE = "11";
const COUNTY_CODE = "75";

describe("public referents route (real Postgres)", () => {
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

	async function readAuditCount(): Promise<number> {
		const rows = await sql<{ count: string }[]>`
			SELECT count(*)::text AS count FROM audit.action_log
		`;
		return Number(rows[0]?.count);
	}

	async function expectNoDelayedAuditRow(): Promise<void> {
		// The route does not await logAction, so an insert regression may land after the response.
		const deadline = Date.now() + 500;
		while (Date.now() < deadline) {
			expect(await readAuditCount()).toBe(0);
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		expect(await readAuditCount()).toBe(0);
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

	it("does not persist a JSON read", async () => {
		const response = await callRoute(
			"http://localhost/api/public/referents-egalite-professionnelle",
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toHaveLength(1);

		await expectNoDelayedAuditRow();
	});

	it("does not persist a CSV read", async () => {
		const response = await callRoute(
			"http://localhost/api/public/referents-egalite-professionnelle?format=csv",
		);
		expect(response.status).toBe(200);

		await expectNoDelayedAuditRow();
	});
});
