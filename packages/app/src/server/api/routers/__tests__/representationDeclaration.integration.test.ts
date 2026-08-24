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
	COMPUTABLE_EXECUTIVES,
	COMPUTABLE_MEMBERS,
	FULL_REPRESENTATION_PAYLOAD,
	NOT_COMPUTABLE_PAYLOAD,
	OFFLINE_PUBLICATION,
	VALID_REFERENCE_PERIOD,
	REPRESENTATION_YEAR as YEAR,
} from "~/modules/declaration-representation/__tests__/fixtures";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("representationDeclarationRouter against a real Postgres", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "111222333";
	const OTHER_SIREN = "444555666";
	const USER_ID = "representation-integration-user";
	const USER_EMAIL = "representation-integration@example.fr";
	const OPEN_CAMPAIGN_YEAR = YEAR + 1;
	const CLOSED_YEAR = 2030;
	const CLOSED_CAMPAIGN_YEAR = CLOSED_YEAR + 1;
	const DRAFT = { currentStep: 2, ...VALID_REFERENCE_PERIOD };

	// Called through the app router so the procedure paths — and therefore the
	// audit `PROCEDURE_TO_ACTION` keys — are the production ones.
	function createCaller(siren = SIREN) {
		return appRouter.createCaller({
			db,
			session: {
				user: {
					id: USER_ID,
					email: USER_EMAIL,
					siret: `${siren}00015`,
					isAdmin: false,
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never).representationDeclaration;
	}

	async function countDeclarations(siren = SIREN) {
		const rows = await sql<{ count: string }[]>`
			SELECT count(*)::text AS count
			FROM app_representation_declaration
			WHERE siren = ${siren}
		`;
		return Number(rows[0]?.count ?? "0");
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });

		await sql`INSERT INTO app_user (id, email) VALUES (${USER_ID}, ${USER_EMAIL})`;
		await sql`
			INSERT INTO app_company (siren, name)
			VALUES (${SIREN}, 'Société Représentation'), (${OTHER_SIREN}, 'Société Voisine')
		`;
		await sql`
			INSERT INTO app_representation_campaign (year, campaign_start_date, campaign_end_date, declaration_deadline)
			VALUES
				(${OPEN_CAMPAIGN_YEAR}, '2000-01-01', '2999-12-31', '2000-03-01'),
				(${CLOSED_CAMPAIGN_YEAR}, '2000-01-01', '2000-12-31', '2000-03-01')
		`;
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM app_representation_declaration WHERE siren IN (${SIREN}, ${OTHER_SIREN})`;
		await sql`DELETE FROM app_representation_campaign WHERE year IN (${OPEN_CAMPAIGN_YEAR}, ${CLOSED_CAMPAIGN_YEAR})`;
		await sql`DELETE FROM app_company WHERE siren IN (${SIREN}, ${OTHER_SIREN})`;
		await sql`DELETE FROM audit.action_log WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_representation_declaration WHERE siren IN (${SIREN}, ${OTHER_SIREN})`;
		await sql`DELETE FROM audit.action_log WHERE user_id = ${USER_ID}`;
	});

	it("restores the draft and the current step saved earlier (S21)", async () => {
		const caller = createCaller();

		await caller.saveDraft({ year: YEAR, draft: DRAFT, currentStep: 2 });
		const { declaration, campaignOpen } = await caller.get({ year: YEAR });

		expect(campaignOpen).toBe(true);
		expect(declaration).toMatchObject({
			siren: SIREN,
			year: YEAR,
			status: "draft",
			currentStep: 2,
			draft: DRAFT,
			declarantId: USER_ID,
		});
	});

	// The explicit projection is the only guard against leaking the V1 import columns.
	it("never exposes the V1 import columns to the client", async () => {
		const caller = createCaller();

		await caller.saveDraft({ year: YEAR, draft: DRAFT, currentStep: 2 });
		const { declaration } = await caller.get({ year: YEAR });

		expect(declaration).not.toBeNull();
		expect(declaration).not.toHaveProperty("legacyDeclarant");
		expect(declaration).not.toHaveProperty("importedFromV1At");
	});

	it("persists a submitted declaration with its derived columns (S19)", async () => {
		const caller = createCaller();

		await caller.submit({ year: YEAR, payload: FULL_REPRESENTATION_PAYLOAD });
		const { declaration } = await caller.get({ year: YEAR });

		expect(declaration).toMatchObject({
			status: "submitted",
			referencePeriodStart: "2025-01-01",
			referencePeriodEnd: "2025-12-31",
			executiveWomenPercent: "60.00",
			executiveMenPercent: "40.00",
			notComputableReasonExecutives: null,
			memberWomenPercent: "55.00",
			memberMenPercent: "45.00",
			notComputableReasonMembers: null,
			publishDate: "2026-03-01",
			publishUrl: FULL_REPRESENTATION_PAYLOAD.publishUrl,
			publishModalities: null,
			draft: null,
			draftUpdatedAt: null,
		});
		expect(declaration?.submittedAt).toBeInstanceOf(Date);
	});

	it("persists the not-computable motives as valid enum values", async () => {
		const caller = createCaller();

		await caller.submit({ year: YEAR, payload: NOT_COMPUTABLE_PAYLOAD });
		const { declaration } = await caller.get({ year: YEAR });

		expect(declaration).toMatchObject({
			executiveWomenPercent: null,
			memberWomenPercent: null,
			notComputableReasonExecutives: "aucun_cadre_dirigeant",
			notComputableReasonMembers: "aucune_instance_dirigeante",
			publishDate: null,
			publishUrl: null,
			publishModalities: null,
		});
	});

	it("replaces the previous submission instead of duplicating it (S22)", async () => {
		const caller = createCaller();

		await caller.submit({ year: YEAR, payload: FULL_REPRESENTATION_PAYLOAD });
		await caller.submit({
			year: YEAR,
			payload: {
				...VALID_REFERENCE_PERIOD,
				...COMPUTABLE_EXECUTIVES,
				...COMPUTABLE_MEMBERS,
				...OFFLINE_PUBLICATION,
			},
		});

		const { declaration } = await caller.get({ year: YEAR });

		expect(await countDeclarations()).toBe(1);
		expect(declaration).toMatchObject({
			status: "submitted",
			publishUrl: null,
			publishModalities: OFFLINE_PUBLICATION.publishModalities,
		});
	});

	it("keeps the submitted status when a later draft is saved", async () => {
		const caller = createCaller();

		await caller.submit({ year: YEAR, payload: FULL_REPRESENTATION_PAYLOAD });
		const submittedAt = (await caller.get({ year: YEAR })).declaration
			?.submittedAt;

		await caller.saveDraft({ year: YEAR, draft: DRAFT, currentStep: 2 });
		const { declaration } = await caller.get({ year: YEAR });

		expect(await countDeclarations()).toBe(1);
		expect(declaration).toMatchObject({
			status: "submitted",
			submittedAt,
			draft: DRAFT,
			currentStep: 2,
		});
	});

	it("never exposes the declaration of another company", async () => {
		await sql`
			INSERT INTO app_representation_declaration (id, siren, year, status, publish_url)
			VALUES ('other-company-row', ${OTHER_SIREN}, ${YEAR}, 'submitted', 'https://voisine.fr')
		`;
		const caller = createCaller();

		await caller.saveDraft({ year: YEAR, draft: DRAFT, currentStep: 2 });
		const { declaration } = await caller.get({ year: YEAR });

		expect(declaration?.siren).toBe(SIREN);
		expect(declaration?.publishUrl).toBeNull();
		expect(await countDeclarations(OTHER_SIREN)).toBe(1);
	});

	it("refuses any write once the campaign is closed (S23)", async () => {
		const caller = createCaller();

		await expect(
			caller.saveDraft({ year: CLOSED_YEAR, draft: DRAFT, currentStep: 2 }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		await expect(
			caller.submit({
				year: CLOSED_YEAR,
				payload: FULL_REPRESENTATION_PAYLOAD,
			}),
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		const { declaration, campaignOpen } = await caller.get({
			year: CLOSED_YEAR,
		});

		expect(campaignOpen).toBe(false);
		expect(declaration).toBeNull();
		expect(await countDeclarations()).toBe(0);
	});

	it("records every procedure in the audit log with its retention category", async () => {
		const caller = createCaller();

		await caller.saveDraft({ year: YEAR, draft: DRAFT, currentStep: 2 });
		await caller.get({ year: YEAR });
		await caller.submit({ year: YEAR, payload: FULL_REPRESENTATION_PAYLOAD });

		await vi.waitFor(async () => {
			const rows = await sql<
				{ action: string; category: string; siren: string | null }[]
			>`
				SELECT DISTINCT action, category, siren FROM audit.action_log
				WHERE user_id = ${USER_ID}
				ORDER BY action
			`;
			expect([...rows]).toEqual([
				// The submission acknowledgement is enqueued by `submit` itself, so
				// its own audit row belongs to the same procedure run.
				{
					action: "notification.enqueue",
					category: "mutation",
					siren: SIREN,
				},
				{
					action: "representation_declaration.get",
					category: "read_sensitive",
					siren: SIREN,
				},
				{
					action: "representation_declaration.save_draft",
					category: "mutation",
					siren: SIREN,
				},
				{
					action: "representation_declaration.submit",
					category: "mutation",
					siren: SIREN,
				},
			]);
		}, 5_000);
	});
});
