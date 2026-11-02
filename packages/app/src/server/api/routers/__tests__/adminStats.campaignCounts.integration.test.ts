import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { env } from "~/env.js";
import { adminStatsRouter } from "~/server/api/routers/adminStats";
import { db } from "~/server/db";

describe("adminStats — campaign counts (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const YEAR = 2088;
	const USER_ID = "t4740-declarant";
	const SUBMITTED_AT = "2088-03-10T09:00:00Z";
	const RESUBMITTED_AT = "2088-03-20T09:00:00Z";

	const SIREN_REDECLARED = "900474001";
	const SIREN_AWAITING_CSE = "900474002";
	const SIREN_DRAFT = "900474003";
	const SIREN_OUT_OF_GIP = "900474004";
	const SIRENS = [
		SIREN_REDECLARED,
		SIREN_AWAITING_CSE,
		SIREN_DRAFT,
		SIREN_OUT_OF_GIP,
	];

	function createCaller() {
		return adminStatsRouter.createCaller({
			db,
			session: {
				user: {
					id: USER_ID,
					email: "t4740-admin@example.fr",
					isAdmin: true,
					adminMfaAt: Math.floor(Date.now() / 1000),
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never);
	}

	async function cleanup() {
		await sql`DELETE FROM app_declaration WHERE siren IN ${sql(SIRENS)}`;
		await sql`DELETE FROM app_gip_mds_data WHERE siren IN ${sql(SIRENS)}`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(SIRENS)}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
	}

	async function insertDeclaration(params: {
		id: string;
		siren: string;
		status: string;
		cancelledAt?: string;
		submittedAt?: string;
	}) {
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id, status, cancelled_at, created_at, updated_at)
			VALUES (${params.id}, ${params.siren}, ${YEAR}, ${USER_ID}, ${params.status}, ${params.cancelledAt ?? null}, ${SUBMITTED_AT}, ${SUBMITTED_AT})
		`;
		if (params.submittedAt) {
			await sql`
				INSERT INTO app_declaration_status_history (id, declaration_id, event_type, round, created_at)
				VALUES (${`${params.id}-submit`}, ${params.id}, 'submit', 0, ${params.submittedAt})
			`;
		}
	}

	async function seed() {
		await sql`
			INSERT INTO app_user (id, email)
			VALUES (${USER_ID}, 't4740-declarant@example.fr')
		`;
		for (const siren of SIRENS) {
			await sql`
				INSERT INTO app_company (siren, name)
				VALUES (${siren}, ${`Société Démo ${siren}`})
			`;
		}
		for (const siren of [SIREN_REDECLARED, SIREN_AWAITING_CSE, SIREN_DRAFT]) {
			await sql`
				INSERT INTO app_gip_mds_data (siren, year, workforce_ema)
				VALUES (${siren}, ${YEAR}, '120.00')
			`;
		}

		await insertDeclaration({
			id: "t4740-redeclared-cancelled",
			siren: SIREN_REDECLARED,
			status: "demarche_completed",
			cancelledAt: "2088-03-15T09:00:00Z",
			submittedAt: SUBMITTED_AT,
		});
		await insertDeclaration({
			id: "t4740-redeclared-active",
			siren: SIREN_REDECLARED,
			status: "demarche_completed",
			submittedAt: RESUBMITTED_AT,
		});
		await insertDeclaration({
			id: "t4740-awaiting-cse",
			siren: SIREN_AWAITING_CSE,
			status: "awaiting_cse_opinion",
			submittedAt: SUBMITTED_AT,
		});
		await insertDeclaration({
			id: "t4740-draft",
			siren: SIREN_DRAFT,
			status: "draft",
		});
		await insertDeclaration({
			id: "t4740-out-of-gip",
			siren: SIREN_OUT_OF_GIP,
			status: "demarche_completed",
			submittedAt: SUBMITTED_AT,
		});
	}

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql.end();
	});

	beforeEach(async () => {
		await cleanup();
		await seed();
	});

	it("counts a cancelled then redeclared company once, and a draft nowhere, in the rate tile", async () => {
		const result = await createCaller().getCampaignStats({ year: YEAR });

		expect(result).toEqual({
			totalObligated: 3,
			totalIndicatorsSubmitted: 2,
			totalDemarcheCompleted: 1,
			completionRate: 33.3,
			previousYearRate: null,
		});
	});

	it("never counts more completed procedures than submitted indicators", async () => {
		const result = await createCaller().getCampaignStats({ year: YEAR });

		expect(result.totalDemarcheCompleted).toBeLessThanOrEqual(
			result.totalIndicatorsSubmitted,
		);
	});

	it("leaves the cancelled declaration out of the progression curve", async () => {
		const [series] = await createCaller().getCampaignProgression({
			years: [YEAR],
		});

		expect(series?.points).toEqual([
			{ day: "2088-03-10", cumulative: 2 },
			{ day: "2088-03-20", cumulative: 3 },
		]);
	});
});
