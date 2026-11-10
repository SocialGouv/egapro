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
import {
	getDefaultCampaignDeadlineColumns,
	getPathChoiceDeadline,
	getPathChoiceRound1Deadline,
	toPersistedIsoDate,
} from "~/modules/domain";
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
	path_choice_round1_deadline: string | null;
	path_choice_deadline: string | null;
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
				decl2_cse_opinion_deadline::text,
				path_choice_round1_deadline::text,
				path_choice_deadline::text
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
		await sql`DELETE FROM app_representation_campaign WHERE year IN (${CONFIGURED_YEAR}, ${UNCONFIGURED_YEAR})`;
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

	it("persists the lock timeout when the singleton row is missing", async () => {
		const original = await sql<
			{
				declaration_lock_timeout_minutes: number;
				updated_at: Date;
				updated_by: string | null;
			}[]
		>`
			SELECT declaration_lock_timeout_minutes, updated_at, updated_by
			FROM app_global_setting WHERE id = 1
		`;
		expect(original).toMatchObject([{ declaration_lock_timeout_minutes: 30 }]);

		try {
			await sql`DELETE FROM app_global_setting WHERE id = 1`;
			const caller = createCaller();
			expect(await caller.getLockTimeout()).toEqual({ timeoutMinutes: 30 });

			expect(await caller.updateLockTimeout({ timeoutMinutes: 45 })).toEqual({
				success: true,
			});
			expect(await caller.getLockTimeout()).toEqual({ timeoutMinutes: 45 });
			expect(
				await sql`
				SELECT declaration_lock_timeout_minutes
				FROM app_global_setting WHERE id = 1
			`,
			).toMatchObject([{ declaration_lock_timeout_minutes: 45 }]);
		} finally {
			await sql`DELETE FROM app_global_setting WHERE id = 1`;
			if (original[0]) {
				await sql`
					INSERT INTO app_global_setting
						(id, declaration_lock_timeout_minutes, updated_at, updated_by)
					VALUES
						(1, ${original[0].declaration_lock_timeout_minutes}, ${original[0].updated_at}, ${original[0].updated_by})
				`;
			}
		}
	});

	it("saving the remuneration deadlines leaves the common calendar, the GIP date and the justification deadlines untouched", async () => {
		await insertConfiguredYear();

		await createCaller().upsertRemunerationDeadlines({
			year: CONFIGURED_YEAR,
			decl1ModificationDeadline: "2097-06-15",
			decl1JointEvaluationDeadline: STORED_ROW.decl1JointEvaluationDeadline,
			decl2ModificationDeadline: STORED_ROW.decl2ModificationDeadline,
			decl2JointEvaluationDeadline: STORED_ROW.decl2JointEvaluationDeadline,
			decl2CseOpinionDeadline: STORED_ROW.decl2CseOpinionDeadline,
			pathChoiceRound1Deadline: "2097-07-15",
			pathChoiceDeadline: "2098-01-15",
		});

		expect(await readRow(CONFIGURED_YEAR)).toEqual({
			gip_publication_date: STORED_ROW.gipPublicationDate,
			campaign_start_date: STORED_ROW.campaignStartDate,
			public_data_release_date: STORED_ROW.publicDataReleaseDate,
			decl1_modification_deadline: "2097-06-15",
			decl1_justification_deadline: STORED_ROW.decl1JustificationDeadline,
			decl1_joint_evaluation_deadline: STORED_ROW.decl1JointEvaluationDeadline,
			decl2_modification_deadline: STORED_ROW.decl2ModificationDeadline,
			decl2_justification_deadline: STORED_ROW.decl2JustificationDeadline,
			decl2_joint_evaluation_deadline: STORED_ROW.decl2JointEvaluationDeadline,
			decl2_cse_opinion_deadline: STORED_ROW.decl2CseOpinionDeadline,
			path_choice_round1_deadline: "2097-07-15",
			path_choice_deadline: "2098-01-15",
		});
	});

	it("ignores justification deadlines sent to the remuneration upsert", async () => {
		await insertConfiguredYear();

		await createCaller().upsertRemunerationDeadlines({
			year: CONFIGURED_YEAR,
			decl1ModificationDeadline: STORED_ROW.decl1ModificationDeadline,
			decl1JointEvaluationDeadline: STORED_ROW.decl1JointEvaluationDeadline,
			decl2ModificationDeadline: STORED_ROW.decl2ModificationDeadline,
			decl2JointEvaluationDeadline: STORED_ROW.decl2JointEvaluationDeadline,
			decl2CseOpinionDeadline: STORED_ROW.decl2CseOpinionDeadline,
			pathChoiceRound1Deadline: "2097-07-01",
			pathChoiceDeadline: "2098-01-01",
			decl1JustificationDeadline: "2099-01-01",
			decl2JustificationDeadline: "2099-02-01",
		} as never);

		expect(await readRow(CONFIGURED_YEAR)).toMatchObject({
			decl1_justification_deadline: STORED_ROW.decl1JustificationDeadline,
			decl2_justification_deadline: STORED_ROW.decl2JustificationDeadline,
		});
	});

	it("saving the remuneration deadlines of an unconfigured year creates its row with an empty common calendar and the default justification deadlines", async () => {
		await createCaller().upsertRemunerationDeadlines({
			year: UNCONFIGURED_YEAR,
			decl1ModificationDeadline: "2098-06-01",
			decl1JointEvaluationDeadline: "2098-08-01",
			decl2ModificationDeadline: "2098-12-01",
			decl2JointEvaluationDeadline: "2099-01-01",
			decl2CseOpinionDeadline: "2099-02-01",
			pathChoiceRound1Deadline: "2098-07-01",
			pathChoiceDeadline: "2099-01-01",
		});

		const defaults = getDefaultCampaignDeadlineColumns(UNCONFIGURED_YEAR);
		expect(await readRow(UNCONFIGURED_YEAR)).toEqual({
			gip_publication_date: null,
			campaign_start_date: null,
			public_data_release_date: null,
			decl1_modification_deadline: "2098-06-01",
			decl1_justification_deadline: defaults.decl1JustificationDeadline,
			decl1_joint_evaluation_deadline: "2098-08-01",
			decl2_modification_deadline: "2098-12-01",
			decl2_justification_deadline: defaults.decl2JustificationDeadline,
			decl2_joint_evaluation_deadline: "2099-01-01",
			decl2_cse_opinion_deadline: "2099-02-01",
			path_choice_round1_deadline: "2098-07-01",
			path_choice_deadline: "2099-01-01",
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
			path_choice_round1_deadline: null,
			path_choice_deadline: null,
		});
	});

	it("reads the computed path choice deadlines for a year saved before they were configurable (#4711)", async () => {
		await insertConfiguredYear();

		const result = await createCaller().getDeadlinesByYear({
			year: CONFIGURED_YEAR,
		});

		expect(result.pathChoiceRound1Deadline).toBe(
			toPersistedIsoDate(getPathChoiceRound1Deadline(CONFIGURED_YEAR)),
		);
		expect(result.pathChoiceDeadline).toBe(
			toPersistedIsoDate(getPathChoiceDeadline(CONFIGURED_YEAR)),
		);
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

	it.each([
		["an empty", ""],
		["a null", null],
	])("refuses %s opening date with BAD_REQUEST and writes nothing", async (_label, campaignStartDate) => {
		await insertConfiguredYear();

		await expect(
			createCaller().updateCommonCalendar({
				year: CONFIGURED_YEAR,
				campaignStartDate,
				publicDataReleaseDate: null,
			} as never),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		expect(await readRow(CONFIGURED_YEAR)).toMatchObject({
			campaign_start_date: STORED_ROW.campaignStartDate,
			public_data_release_date: STORED_ROW.publicDataReleaseDate,
		});
	});

	it("audits the common calendar mutation under its own action key", async () => {
		await insertConfiguredYear();

		await createCaller().updateCommonCalendar({
			year: CONFIGURED_YEAR,
			campaignStartDate: "2097-04-01",
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
	async function readRepresentationRow(year: number) {
		const rows = await sql<
			{
				campaign_start_date: string;
				campaign_end_date: string;
				declaration_deadline: string;
			}[]
		>`
			SELECT
				campaign_start_date::text,
				campaign_end_date::text,
				declaration_deadline::text
			FROM app_representation_campaign
			WHERE year = ${year}
		`;
		return rows[0];
	}

	it("saving the representation campaign only rewrites its declaration deadline", async () => {
		await sql`
			INSERT INTO app_representation_campaign
				(year, campaign_start_date, campaign_end_date, declaration_deadline)
			VALUES (${CONFIGURED_YEAR}, '2097-02-01', '2097-11-30', '2097-04-15')
		`;

		await createCaller().upsertRepresentationCampaign({
			year: CONFIGURED_YEAR,
			declarationDeadline: "2097-05-20",
			campaignStartDate: "2097-06-01",
			campaignEndDate: "2097-06-30",
		} as never);

		expect(await readRepresentationRow(CONFIGURED_YEAR)).toEqual({
			campaign_start_date: "2097-02-01",
			campaign_end_date: "2097-11-30",
			declaration_deadline: "2097-05-20",
		});
	});

	it("saving the representation campaign of a year without row creates it with the default campaign window", async () => {
		await createCaller().upsertRepresentationCampaign({
			year: UNCONFIGURED_YEAR,
			declarationDeadline: "2098-04-15",
		});

		expect(await readRepresentationRow(UNCONFIGURED_YEAR)).toEqual({
			campaign_start_date: "2098-01-01",
			campaign_end_date: "2098-12-31",
			declaration_deadline: "2098-04-15",
		});
	});
});
