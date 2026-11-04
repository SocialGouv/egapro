import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { env } from "~/env.js";
import {
	DEMARCHE_LIFECYCLE_STATUSES,
	type DeclarationFsmStatus,
	type DemarcheLifecycleStatus,
	getDemarcheLifecycleStatus,
} from "~/modules/domain";
import { adminDeclarationsRouter } from "~/server/api/routers/adminDeclarations";
import { db } from "~/server/db";
import { demarcheStatusDate } from "~/server/db/declarationConditions";
import { declarations } from "~/server/db/schema";

// Sort and filters run on SQL mirrors while rows are labelled by the domain: only a real database shows they agree.
describe("adminDeclarations.search — démarche status and date (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const YEAR = 2081;
	const USER_ID = "admin-search-lifecycle-declarant";

	type HistoryEvent = {
		type: string;
		at: string;
		value?: string;
		round?: number;
	};

	type Fixture = {
		key: string;
		status: DeclarationFsmStatus;
		createdAt: string;
		cancelledAt?: string;
		history: HistoryEvent[];
	};

	const FIXTURES: Fixture[] = [
		{
			key: "draft",
			status: "draft",
			createdAt: "2081-03-10T09:00:00Z",
			history: [],
		},
		{
			key: "awaiting-path",
			status: "awaiting_compliance_path_choice",
			createdAt: "2081-03-01T09:00:00Z",
			history: [{ type: "submit", at: "2081-03-12T09:00:00Z" }],
		},
		{
			key: "corrective",
			status: "corrective_actions_chosen",
			createdAt: "2081-03-01T09:00:00Z",
			history: [
				{ type: "step_change", at: "2081-03-02T09:00:00Z", round: 0 },
				{ type: "submit", at: "2081-03-12T09:00:00Z" },
				{
					type: "path_choice",
					at: "2081-03-15T09:00:00Z",
					value: "corrective_action",
					round: 1,
				},
				{ type: "step_change", at: "2081-03-16T09:00:00Z", round: 2 },
			],
		},
		{
			key: "joint",
			status: "joint_evaluation_chosen",
			createdAt: "2081-03-01T09:00:00Z",
			history: [
				{ type: "submit", at: "2081-03-11T09:00:00Z" },
				{
					type: "path_choice",
					at: "2081-03-13T09:00:00Z",
					value: "joint_evaluation",
					round: 1,
				},
			],
		},
		{
			key: "revision",
			status: "awaiting_revision_choice",
			createdAt: "2081-03-01T09:00:00Z",
			history: [
				{ type: "submit", at: "2081-03-05T09:00:00Z" },
				{
					type: "path_choice",
					at: "2081-03-06T09:00:00Z",
					value: "corrective_action",
					round: 1,
				},
				{ type: "second_declaration_submit", at: "2081-03-17T09:00:00Z" },
			],
		},
		{
			key: "revised-joint",
			status: "revised_joint_evaluation_chosen",
			createdAt: "2081-03-01T09:00:00Z",
			history: [
				{ type: "submit", at: "2081-03-03T09:00:00Z" },
				{ type: "second_declaration_submit", at: "2081-03-07T09:00:00Z" },
				{
					type: "path_choice",
					at: "2081-03-19T09:00:00Z",
					value: "joint_evaluation",
					round: 2,
				},
			],
		},
		{
			key: "cse",
			status: "awaiting_cse_opinion",
			createdAt: "2081-03-01T09:00:00Z",
			history: [
				{ type: "submit", at: "2081-03-04T09:00:00Z" },
				{ type: "joint_evaluation_submit", at: "2081-03-09T09:00:00Z" },
			],
		},
		{
			key: "completed",
			status: "demarche_completed",
			createdAt: "2081-03-01T09:00:00Z",
			history: [
				{ type: "submit", at: "2081-03-02T09:00:00Z" },
				{ type: "cse_opinion_submit", at: "2081-03-20T09:00:00Z" },
				{ type: "demarche_complete", at: "2081-03-20T09:00:01Z" },
			],
		},
		{
			key: "completed-direct",
			status: "demarche_completed",
			createdAt: "2081-03-01T09:00:00Z",
			history: [
				{ type: "submit", at: "2081-03-05T09:00:00Z" },
				{ type: "demarche_complete", at: "2081-03-05T09:00:01Z" },
			],
		},
		{
			key: "cancelled",
			status: "awaiting_compliance_path_choice",
			createdAt: "2081-03-01T09:00:00Z",
			cancelledAt: "2081-03-18T23:30:00Z",
			history: [
				{ type: "submit", at: "2081-03-12T09:00:00Z" },
				{ type: "cancel", at: "2081-03-18T23:30:00Z" },
			],
		},
		{
			key: "cancelled-draft",
			status: "draft",
			createdAt: "2081-03-01T09:00:00Z",
			cancelledAt: "2081-03-08T10:00:00Z",
			history: [],
		},
		{
			key: "in-progress-undated",
			status: "corrective_actions_chosen",
			createdAt: "2081-03-01T09:00:00Z",
			history: [],
		},
	];

	const SIRENS = FIXTURES.map(
		(_, index) => `9810000${String(index).padStart(2, "0")}`,
	);

	function declarationId(fixture: Fixture): string {
		return `admin-search-lifecycle-${fixture.key}`;
	}

	function expectedStatus(fixture: Fixture): DemarcheLifecycleStatus {
		return getDemarcheLifecycleStatus({
			status: fixture.status,
			cancelledAt: fixture.cancelledAt ? new Date(fixture.cancelledAt) : null,
		});
	}

	function createCaller() {
		return adminDeclarationsRouter.createCaller({
			db,
			session: {
				user: {
					id: USER_ID,
					email: "admin-search-lifecycle@example.fr",
					isAdmin: true,
					adminMfaAt: Math.floor(Date.now() / 1000),
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never);
	}

	type SearchInput = Parameters<ReturnType<typeof createCaller>["search"]>[0];

	async function search(input: Omit<SearchInput, "year" | "pageSize"> = {}) {
		return createCaller().search({ ...input, year: YEAR, pageSize: 100 });
	}

	async function cleanup() {
		await sql`DELETE FROM app_declaration WHERE siren IN ${sql(SIRENS)}`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(SIRENS)}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
	}

	async function seed() {
		await sql`
			INSERT INTO app_user (id, email)
			VALUES (${USER_ID}, 'admin-search-lifecycle-declarant@example.fr')
		`;
		for (const [index, fixture] of FIXTURES.entries()) {
			const siren = SIRENS[index] as string;
			const id = declarationId(fixture);
			await sql`
				INSERT INTO app_company (siren, name)
				VALUES (${siren}, ${`Société Démo ${fixture.key}`})
			`;
			await sql`
				INSERT INTO app_declaration (id, siren, year, declarant_id, status, cancelled_at, created_at, updated_at)
				VALUES (${id}, ${siren}, ${YEAR}, ${USER_ID}, ${fixture.status}, ${fixture.cancelledAt ?? null}, ${fixture.createdAt}, ${fixture.createdAt})
			`;
			for (const [eventIndex, event] of fixture.history.entries()) {
				await sql`
					INSERT INTO app_declaration_status_history (id, declaration_id, event_type, value, round, created_at)
					VALUES (${`${id}-${eventIndex}`}, ${id}, ${event.type}, ${event.value ?? null}, ${event.round ?? null}, ${event.at})
				`;
			}
		}
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

	it("covers every engine state and every démarche status, so the parity checks cannot agree vacuously", () => {
		const states = new Set(FIXTURES.map((fixture) => fixture.status));
		const statuses = new Set(FIXTURES.map(expectedStatus));

		expect(states.size).toBe(8);
		expect([...statuses].sort()).toEqual(
			[...DEMARCHE_LIFECYCLE_STATUSES].sort(),
		);
	});

	it.each(
		DEMARCHE_LIFECYCLE_STATUSES,
	)("filters %s on exactly the rows the domain classifies so, with a matching total", async (status) => {
		const result = await search({ status });

		const expectedIds = FIXTURES.filter(
			(fixture) => expectedStatus(fixture) === status,
		)
			.map(declarationId)
			.sort();
		expect(result.rows.map((row) => row.id).sort()).toEqual(expectedIds);
		expect(result.rows.every((row) => row.demarcheStatus === status)).toBe(
			true,
		);
		expect(result.total).toBe(expectedIds.length);
	});

	it.each([
		"asc",
		"desc",
	] as const)("sorts on the status date %s along the domain dates, undated rows last", async (sortOrder) => {
		const { rows } = await search({ sortBy: "statusDate", sortOrder });

		expect(rows).toHaveLength(FIXTURES.length);
		const dated = rows.filter((row) => row.statusDate !== null);
		const undated = rows.filter((row) => row.statusDate === null);
		expect(undated.map((row) => row.id)).toEqual([
			"admin-search-lifecycle-in-progress-undated",
		]);
		expect(rows.slice(dated.length)).toEqual(undated);

		const times = dated.map((row) => row.statusDate?.getTime() ?? 0);
		const sorted = [...times].sort((a, b) =>
			sortOrder === "asc" ? a - b : b - a,
		);
		expect(times).toEqual(sorted);
	});

	it("sorts on the démarche status in the order Brouillon, En cours, Finalisée, Annulée", async () => {
		const { rows } = await search({
			sortBy: "demarcheStatus",
			sortOrder: "asc",
		});

		const ranks = rows.map((row) =>
			DEMARCHE_LIFECYCLE_STATUSES.indexOf(row.demarcheStatus),
		);
		expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
		expect(new Set(rows.map((row) => row.demarcheStatus)).size).toBe(4);
	});

	it("never repeats nor drops a row across pages of a démarche status sort", async () => {
		const seen: string[] = [];
		for (const page of [1, 2]) {
			const result = await createCaller().search({
				year: YEAR,
				sortBy: "demarcheStatus",
				sortOrder: "asc",
				pageSize: 10,
				page,
			});
			seen.push(...result.rows.map((row) => row.id));
		}

		expect(seen).toHaveLength(FIXTURES.length);
		expect(new Set(seen).size).toBe(FIXTURES.length);
	});

	it("labels the last transmission from the history, ignoring a later stepper navigation", async () => {
		const { rows } = await search({});
		const row = rows.find(
			(candidate) => candidate.id === "admin-search-lifecycle-corrective",
		);

		expect(row).toMatchObject({
			demarcheStatus: "in_progress",
			lastTransmittedStep: "Choix du parcours — Actions correctives",
			nextStep: "Actions correctives et seconde déclaration",
			statusDate: new Date("2081-03-15T09:00:00Z"),
		});
	});

	it("keeps what a cancelled démarche had transmitted and dates it from its cancellation", async () => {
		const { rows } = await search({});
		const cancelled = rows.find(
			(candidate) => candidate.id === "admin-search-lifecycle-cancelled",
		);
		const cancelledDraft = rows.find(
			(candidate) => candidate.id === "admin-search-lifecycle-cancelled-draft",
		);

		expect(cancelled).toMatchObject({
			lastTransmittedStep: "Transmission de la déclaration",
			nextStep: null,
			statusDate: new Date("2081-03-18T23:30:00Z"),
		});
		expect(cancelledDraft).toMatchObject({
			lastTransmittedStep: null,
			nextStep: null,
		});
	});

	it("dates a completed démarche from its last completion event", async () => {
		const { rows } = await search({ status: "completed" });
		const direct = rows.find(
			(candidate) => candidate.id === "admin-search-lifecycle-completed-direct",
		);

		expect(direct).toMatchObject({
			lastTransmittedStep: "Transmission de la déclaration",
			statusDate: new Date("2081-03-05T09:00:01Z"),
		});
	});

	it.each([
		{ dateFrom: "2081-03-14" },
		{ dateTo: "2081-03-12" },
		{ dateFrom: "2081-03-12", dateTo: "2081-03-18" },
	])("keeps the date filter within its bounds: %o", async (bounds) => {
		const result = await search(bounds);

		const from = bounds.dateFrom
			? new Date(`${bounds.dateFrom}T00:00:00Z`)
			: null;
		const to =
			"dateTo" in bounds && bounds.dateTo
				? new Date(`${bounds.dateTo}T23:59:59Z`)
				: null;
		const all = (await search({})).rows;
		const expectedIds = all
			.filter((row) => {
				if (row.statusDate === null) return false;
				if (from && row.statusDate < from) return false;
				if (to && row.statusDate >= to) return false;
				return true;
			})
			.map((row) => row.id)
			.sort();

		expect(expectedIds.length).toBeGreaterThan(0);
		expect(result.rows.map((row) => row.id).sort()).toEqual(expectedIds);
		expect(result.total).toBe(expectedIds.length);
	});

	it("keeps a démarche transmitted on 15/03 and drops one opened on 10/03 from a date filter starting 14/03", async () => {
		const ids = (await search({ dateFrom: "2081-03-14" })).rows.map(
			(row) => row.id,
		);

		expect(ids).toContain("admin-search-lifecycle-corrective");
		expect(ids).not.toContain("admin-search-lifecycle-draft");
	});

	// cancelled_at carries no time zone: read under another session zone, a missing conversion would shift it.
	it("reads the cancellation date as UTC whatever the session time zone", async () => {
		const shifted = postgres(env.DATABASE_URL, {
			max: 1,
			connection: { TimeZone: "Pacific/Kiritimati" },
		});
		try {
			const shiftedDb = drizzle(shifted, { casing: "snake_case" });
			const [row] = await shiftedDb
				.select({ statusDate: demarcheStatusDate() })
				.from(declarations)
				.where(eq(declarations.id, "admin-search-lifecycle-cancelled"));

			expect(row?.statusDate).toEqual(new Date("2081-03-18T23:30:00Z"));
		} finally {
			await shifted.end();
		}
	});
});
