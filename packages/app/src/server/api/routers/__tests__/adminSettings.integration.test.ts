import postgres from "postgres";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

import { env } from "~/env.js";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

type CampaignDeadlineRow = {
	gip_publication_date: string | null;
	campaign_start_date: string | null;
	public_data_release_date: string | null;
	decl1_modification_deadline: string;
	decl1_justification_deadline: string;
	decl1_joint_evaluation_deadline: string;
	decl2_modification_deadline: string;
	decl2_justification_deadline: string;
	decl2_joint_evaluation_deadline: string;
	decl2_cse_opinion_deadline: string;
};

describe("adminSettings — each settings block only writes its own columns (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const ADMIN_ID = "123e4567-e89b-42d3-a456-426614174000";
	const ADMIN_EMAIL = "admin-settings-integration@example.fr";
	const CONFIGURED_YEAR = 2097;
	const UNCONFIGURED_YEAR = 2098;

	const STORED_ROW = {
		gipPublicationDate: "2097-03-02",
		campaignStartDate: "2097-03-10",
		publicDataReleaseDate: "2098-01-15",
		decl1ModificationDeadline: "2097-06-01",
		decl1JustificationDeadline: "2098-03-01",
		decl1JointEvaluationDeadline: "2097-08-01",
		decl2ModificationDeadline: "2097-12-01",
		decl2JustificationDeadline: "2097-12-01",
		decl2JointEvaluationDeadline: "2098-01-01",
		decl2CseOpinionDeadline: "2098-02-01",
	};

	function createCaller() {
		return appRouter.createCaller({
			db,
			session: {
				user: {
					id: ADMIN_ID,
					email: ADMIN_EMAIL,
					isAdmin: true,
					adminMfaAt: Math.floor(Date.now() / 1000),
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never).adminSettings;
	}

	async function readRow(year: number) {
		const rows = await sql<CampaignDeadlineRow[]>`
			SELECT
				gip_publication_date::text,
				campaign_start_date::text,
				public_data_release_date::text,
				decl1_modification_deadline::text,
				decl1_justification_deadline::text,
				decl1_joint_evaluation_deadline::text,
				decl2_modification_deadline::text,
				decl2_justification_deadline::text,
				decl2_joint_evaluation_deadline::text,
				decl2_cse_opinion_deadline::text
			FROM app_campaign_deadline
			WHERE year = ${year}
		`;
		return rows[0];
	}

	async function insertConfiguredYear() {
		await sql`
			INSERT INTO app_campaign_deadline (
				year,
				gip_publication_date,
				campaign_start_date,
				public_data_release_date,
				decl1_modification_deadline,
				decl1_justification_deadline,
				decl1_joint_evaluation_deadline,
				decl2_modification_deadline,
				decl2_justification_deadline,
				decl2_joint_evaluation_deadline,
				decl2_cse_opinion_deadline
			) VALUES (
				${CONFIGURED_YEAR},
				${STORED_ROW.gipPublicationDate},
				${STORED_ROW.campaignStartDate},
				${STORED_ROW.publicDataReleaseDate},
				${STORED_ROW.decl1ModificationDeadline},
				${STORED_ROW.decl1JustificationDeadline},
				${STORED_ROW.decl1JointEvaluationDeadline},
				${STORED_ROW.decl2ModificationDeadline},
				${STORED_ROW.decl2JustificationDeadline},
				${STORED_ROW.decl2JointEvaluationDeadline},
				${STORED_ROW.decl2CseOpinionDeadline}
			)
		`;
	}

	async function cleanUp() {
		await sql`DELETE FROM app_campaign_deadline WHERE year IN (${CONFIGURED_YEAR}, ${UNCONFIGURED_YEAR})`;
		await sql`DELETE FROM audit.action_log WHERE user_id = ${ADMIN_ID}`;
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await sql`
			INSERT INTO app_user (id, email) VALUES (${ADMIN_ID}, ${ADMIN_EMAIL})
			ON CONFLICT DO NOTHING
		`;
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanUp();
		await sql`DELETE FROM app_user WHERE id = ${ADMIN_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await cleanUp();
	});

	it("saving the remuneration deadlines leaves the common calendar and the GIP date untouched", async () => {
		await insertConfiguredYear();

		await createCaller().upsertRemunerationDeadlines({
			year: CONFIGURED_YEAR,
			decl1ModificationDeadline: "2097-06-15",
			decl1JustificationDeadline: STORED_ROW.decl1JustificationDeadline,
			decl1JointEvaluationDeadline: STORED_ROW.decl1JointEvaluationDeadline,
			decl2ModificationDeadline: STORED_ROW.decl2ModificationDeadline,
			decl2JustificationDeadline: STORED_ROW.decl2JustificationDeadline,
			decl2JointEvaluationDeadline: STORED_ROW.decl2JointEvaluationDeadline,
			decl2CseOpinionDeadline: STORED_ROW.decl2CseOpinionDeadline,
		});

		expect(await readRow(CONFIGURED_YEAR)).toMatchObject({
			decl1_modification_deadline: "2097-06-15",
			gip_publication_date: STORED_ROW.gipPublicationDate,
			campaign_start_date: STORED_ROW.campaignStartDate,
			public_data_release_date: STORED_ROW.publicDataReleaseDate,
		});
	});

	it("saving the remuneration deadlines of an unconfigured year creates its row with an empty common calendar", async () => {
		await createCaller().upsertRemunerationDeadlines({
			year: UNCONFIGURED_YEAR,
			decl1ModificationDeadline: "2098-06-01",
			decl1JustificationDeadline: "2099-03-01",
			decl1JointEvaluationDeadline: "2098-08-01",
			decl2ModificationDeadline: "2098-12-01",
			decl2JustificationDeadline: "2098-12-01",
			decl2JointEvaluationDeadline: "2099-01-01",
			decl2CseOpinionDeadline: "2099-02-01",
		});

		expect(await readRow(UNCONFIGURED_YEAR)).toMatchObject({
			decl1_modification_deadline: "2098-06-01",
			gip_publication_date: null,
			campaign_start_date: null,
			public_data_release_date: null,
		});
	});

	it("saving the common calendar leaves the seven remuneration deadlines and the GIP date untouched", async () => {
		await insertConfiguredYear();

		await createCaller().updateCommonCalendar({
			year: CONFIGURED_YEAR,
			campaignStartDate: "2097-04-01",
			publicDataReleaseDate: "2098-02-20",
		});

		expect(await readRow(CONFIGURED_YEAR)).toEqual({
			gip_publication_date: STORED_ROW.gipPublicationDate,
			campaign_start_date: "2097-04-01",
			public_data_release_date: "2098-02-20",
			decl1_modification_deadline: STORED_ROW.decl1ModificationDeadline,
			decl1_justification_deadline: STORED_ROW.decl1JustificationDeadline,
			decl1_joint_evaluation_deadline: STORED_ROW.decl1JointEvaluationDeadline,
			decl2_modification_deadline: STORED_ROW.decl2ModificationDeadline,
			decl2_justification_deadline: STORED_ROW.decl2JustificationDeadline,
			decl2_joint_evaluation_deadline: STORED_ROW.decl2JointEvaluationDeadline,
			decl2_cse_opinion_deadline: STORED_ROW.decl2CseOpinionDeadline,
		});
	});

	it("refuses the common calendar of an unconfigured year and creates no row", async () => {
		await expect(
			createCaller().updateCommonCalendar({
				year: UNCONFIGURED_YEAR,
				campaignStartDate: "2098-03-01",
				publicDataReleaseDate: "2099-01-15",
			}),
		).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

		expect(await readRow(UNCONFIGURED_YEAR)).toBeUndefined();
	});

	it("audits the common calendar mutation under its own action key", async () => {
		await insertConfiguredYear();

		await createCaller().updateCommonCalendar({
			year: CONFIGURED_YEAR,
			campaignStartDate: null,
			publicDataReleaseDate: "2098-02-20",
		});

		await vi.waitFor(async () => {
			const rows = await sql<{ action: string; status: string }[]>`
				SELECT action, status FROM audit.action_log
				WHERE user_id = ${ADMIN_ID}
			`;
			expect(rows).toContainEqual({
				action: "admin_settings.update_common_calendar",
				status: "success",
			});
		}, 5_000);
	});
});
