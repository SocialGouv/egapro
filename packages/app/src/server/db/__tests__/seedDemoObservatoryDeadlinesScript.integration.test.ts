// Real Postgres, not a mocked driver: the seven columns are NOT NULL `date` columns, and the driver's own date round-trip is part of what's under test.
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { resetStaleDefaultDeadlines } from "#scripts/seed-demo-observatory";
import { env } from "~/env.js";
import { getDefaultCampaignDeadlineColumns } from "~/modules/domain";

const STALE_YEAR = 2101;
const CONFIGURED_YEAR = 2102;
const TEST_YEARS = [STALE_YEAR, CONFIGURED_YEAR];

// postgres.js returns a `date` column as either a `Date` or a string depending on parser config.
function toIsoDate(value: Date | string | null): string | null {
	if (value === null) return null;
	return typeof value === "string" ? value : value.toISOString().slice(0, 10);
}

describe("resetStaleDefaultDeadlines (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	async function cleanup() {
		await sql`DELETE FROM app_campaign_deadline WHERE year = ANY(${TEST_YEARS})`;
	}

	async function readRow(year: number) {
		const [row] = await sql<
			[
				{
					gipPublicationDate: Date | string | null;
					campaignStartDate: Date | string | null;
					publicDataReleaseDate: Date | string | null;
					decl1ModificationDeadline: Date | string;
					decl1JustificationDeadline: Date | string;
					decl1JointEvaluationDeadline: Date | string;
					decl2ModificationDeadline: Date | string;
					decl2JustificationDeadline: Date | string;
					decl2JointEvaluationDeadline: Date | string;
					decl2CseOpinionDeadline: Date | string;
				},
			]
		>`
			SELECT
				gip_publication_date AS "gipPublicationDate",
				campaign_start_date AS "campaignStartDate",
				public_data_release_date AS "publicDataReleaseDate",
				decl1_modification_deadline AS "decl1ModificationDeadline",
				decl1_justification_deadline AS "decl1JustificationDeadline",
				decl1_joint_evaluation_deadline AS "decl1JointEvaluationDeadline",
				decl2_modification_deadline AS "decl2ModificationDeadline",
				decl2_justification_deadline AS "decl2JustificationDeadline",
				decl2_joint_evaluation_deadline AS "decl2JointEvaluationDeadline",
				decl2_cse_opinion_deadline AS "decl2CseOpinionDeadline"
			FROM app_campaign_deadline WHERE year = ${year}
		`;
		return {
			gipPublicationDate: toIsoDate(row.gipPublicationDate),
			campaignStartDate: toIsoDate(row.campaignStartDate),
			publicDataReleaseDate: toIsoDate(row.publicDataReleaseDate),
			decl1ModificationDeadline: toIsoDate(row.decl1ModificationDeadline),
			decl1JustificationDeadline: toIsoDate(row.decl1JustificationDeadline),
			decl1JointEvaluationDeadline: toIsoDate(row.decl1JointEvaluationDeadline),
			decl2ModificationDeadline: toIsoDate(row.decl2ModificationDeadline),
			decl2JustificationDeadline: toIsoDate(row.decl2JustificationDeadline),
			decl2JointEvaluationDeadline: toIsoDate(row.decl2JointEvaluationDeadline),
			decl2CseOpinionDeadline: toIsoDate(row.decl2CseOpinionDeadline),
		};
	}

	beforeEach(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await cleanup();
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql.end();
	});

	it("resets a row whose seven deadlines all sit on January 1st of its year, keeping its other three dates", async () => {
		const jan1 = `${STALE_YEAR}-01-01`;
		await sql`
			INSERT INTO app_campaign_deadline (
				year, gip_publication_date, campaign_start_date, public_data_release_date,
				decl1_modification_deadline, decl1_justification_deadline,
				decl1_joint_evaluation_deadline, decl2_modification_deadline,
				decl2_justification_deadline, decl2_joint_evaluation_deadline,
				decl2_cse_opinion_deadline
			) VALUES (
				${STALE_YEAR}, ${"2100-11-01"}, ${"2100-10-01"}, ${"2000-01-01"},
				${jan1}, ${jan1}, ${jan1}, ${jan1}, ${jan1}, ${jan1}, ${jan1}
			)
		`;

		await sql.begin((tx) => resetStaleDefaultDeadlines(tx));

		const row = await readRow(STALE_YEAR);
		const defaults = getDefaultCampaignDeadlineColumns(STALE_YEAR);
		expect(row.decl1ModificationDeadline).toBe(
			defaults.decl1ModificationDeadline,
		);
		expect(row.decl1JustificationDeadline).toBe(
			defaults.decl1JustificationDeadline,
		);
		expect(row.decl1JointEvaluationDeadline).toBe(
			defaults.decl1JointEvaluationDeadline,
		);
		expect(row.decl2ModificationDeadline).toBe(
			defaults.decl2ModificationDeadline,
		);
		expect(row.decl2JustificationDeadline).toBe(
			defaults.decl2JustificationDeadline,
		);
		expect(row.decl2JointEvaluationDeadline).toBe(
			defaults.decl2JointEvaluationDeadline,
		);
		expect(row.decl2CseOpinionDeadline).toBe(defaults.decl2CseOpinionDeadline);
		// The three optional columns an admin or the GIP import may have set are untouched.
		expect(row.gipPublicationDate).toBe("2100-11-01");
		expect(row.campaignStartDate).toBe("2100-10-01");
		expect(row.publicDataReleaseDate).toBe("2000-01-01");
	});

	it("leaves a row an admin configured (deadlines not all on January 1st) untouched", async () => {
		const defaults = getDefaultCampaignDeadlineColumns(CONFIGURED_YEAR);
		await sql`
			INSERT INTO app_campaign_deadline (
				year,
				decl1_modification_deadline, decl1_justification_deadline,
				decl1_joint_evaluation_deadline, decl2_modification_deadline,
				decl2_justification_deadline, decl2_joint_evaluation_deadline,
				decl2_cse_opinion_deadline
			) VALUES (
				${CONFIGURED_YEAR},
				${"2102-07-15"}, ${defaults.decl1JustificationDeadline},
				${defaults.decl1JointEvaluationDeadline}, ${defaults.decl2ModificationDeadline},
				${defaults.decl2JustificationDeadline}, ${defaults.decl2JointEvaluationDeadline},
				${defaults.decl2CseOpinionDeadline}
			)
		`;

		await sql.begin((tx) => resetStaleDefaultDeadlines(tx));

		const row = await readRow(CONFIGURED_YEAR);
		expect(row.decl1ModificationDeadline).toBe("2102-07-15");
	});

	it("is idempotent: a second pass changes nothing further", async () => {
		const jan1 = `${STALE_YEAR}-01-01`;
		await sql`
			INSERT INTO app_campaign_deadline (
				year,
				decl1_modification_deadline, decl1_justification_deadline,
				decl1_joint_evaluation_deadline, decl2_modification_deadline,
				decl2_justification_deadline, decl2_joint_evaluation_deadline,
				decl2_cse_opinion_deadline
			) VALUES (
				${STALE_YEAR}, ${jan1}, ${jan1}, ${jan1}, ${jan1}, ${jan1}, ${jan1}, ${jan1}
			)
		`;

		await sql.begin((tx) => resetStaleDefaultDeadlines(tx));
		const afterFirst = await readRow(STALE_YEAR);
		await sql.begin((tx) => resetStaleDefaultDeadlines(tx));
		const afterSecond = await readRow(STALE_YEAR);

		expect(afterSecond).toStrictEqual(afterFirst);
	});
});
