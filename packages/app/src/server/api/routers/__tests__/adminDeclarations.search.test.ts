import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	COMPANY_SIZE_RANGES,
	DECLARATION_PROCESS_STEP_LABELS,
} from "~/modules/domain";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const DECL_ID_1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const DECL_ID_2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

const adminSession = {
	user: {
		id: "admin-1",
		email: "admin@example.fr",
		isAdmin: true,
		adminMfaAt: Math.floor(Date.now() / 1000),
	},
	expires: "",
};

type Row = {
	id: string;
	siren: string;
	year: number;
	status: string;
	cancelledAt: Date | null;
	remunerationScore: number | null;
	createdAt: Date;
	updatedAt: Date;
	companyName: string;
	workforceEma: string | null;
	declarantEmail: string;
	declarantFirstName: string | null;
	declarantLastName: string | null;
	lastTransmission: { eventType: string; value: string | null } | null;
	lastTransmissionAt: Date | null;
	demarcheCompletedAt: Date | null;
};

// Same casing as the app's db instance, so the generated column names match.
const dialect = new PgDialect({ casing: "snake_case" });

function renderSql(value: unknown): string {
	return dialect.sqlToQuery(value as never).sql;
}

function buildDb(rows: Row[]) {
	const chain = {
		from: vi.fn().mockReturnThis(),
		innerJoin: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		offset: vi.fn().mockResolvedValue(rows),
	};
	const countChain = {
		from: vi.fn().mockReturnThis(),
		innerJoin: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockResolvedValue([{ total: rows.length }]),
	};
	return {
		select: vi
			.fn()
			.mockImplementationOnce(() => chain)
			.mockImplementationOnce(() => countChain),
		__chain: chain,
		__countChain: countChain,
	};
}

function callSearch(db: ReturnType<typeof buildDb>) {
	return import("../adminDeclarations").then(({ adminDeclarationsRouter }) =>
		adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never),
	);
}

const activeRow: Row = {
	id: DECL_ID_1,
	siren: "123456789",
	year: 2026,
	status: "awaiting_compliance_path_choice",
	cancelledAt: null,
	remunerationScore: 85,
	createdAt: new Date("2026-03-01"),
	updatedAt: new Date("2026-03-01"),
	companyName: "ACME Corp",
	workforceEma: "99.97",
	declarantEmail: "alice@example.fr",
	declarantFirstName: "Alice",
	declarantLastName: "Dupont",
	lastTransmission: { eventType: "submit", value: null },
	lastTransmissionAt: new Date("2026-03-12T10:00:00Z"),
	demarcheCompletedAt: null,
};

const cancelledRow: Row = {
	...activeRow,
	id: DECL_ID_2,
	cancelledAt: new Date("2026-04-01"),
};

describe("adminDeclarationsRouter — search", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns only cancelled rows when status=cancelled", async () => {
		const db = buildDb([cancelledRow]);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.search({ status: "cancelled" });

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]?.id).toBe(DECL_ID_2);
	});

	it("includes both active and cancelled rows by default (no status filter)", async () => {
		const db = buildDb([activeRow, cancelledRow]);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.search({});

		expect(result.rows).toHaveLength(2);
	});

	it("excludes cancelled rows when filtering by submitted status", async () => {
		const db = buildDb([activeRow]);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.search({
			status: "in_progress",
		});

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]?.id).toBe(DECL_ID_1);
	});

	it("includes cancelledAt field in search results", async () => {
		const db = buildDb([cancelledRow]);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.search({ status: "cancelled" });

		expect(result.rows[0]?.cancelledAt).toBeInstanceOf(Date);
	});

	it("exposes the GIP headcount floored to the integer", async () => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		const result = await caller.search({});

		expect(result.rows[0]?.workforce).toBe(99);
	});

	it("keeps a company absent from the GIP file listed with an unknown headcount", async () => {
		const db = buildDb([{ ...activeRow, workforceEma: null }]);
		const caller = await callSearch(db);

		const result = await caller.search({});

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]?.workforce).toBeNull();
	});

	it("reads the headcount through a LEFT JOIN on the GIP file, in both queries", async () => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({});

		expect(db.__chain.leftJoin).toHaveBeenCalledTimes(1);
		expect(db.__countChain.leftJoin).toHaveBeenCalledTimes(1);
	});

	it.each([
		"asc",
		"desc",
	] as const)("sorts the headcount %s with the unknown ones last", async (sortOrder) => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({ sortBy: "workforce", sortOrder });

		const orderBy = renderSql(db.__chain.orderBy.mock.calls[0]?.[0]);
		expect(orderBy).toContain("workforce_ema");
		expect(orderBy).toContain(sortOrder === "asc" ? "ASC" : "DESC");
		expect(orderBy).toContain("NULLS LAST");
	});

	it("keeps the other sort columns on their plain column key", async () => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({ sortBy: "companyName", sortOrder: "asc" });

		const orderBy = renderSql(db.__chain.orderBy.mock.calls[0]?.[0]);
		expect(orderBy).not.toContain("workforce_ema");
	});

	it("filters on the size bracket bounds of the domain constant", async () => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({ sizeRange: "100-149" });

		const { sql, params } = dialect.sqlToQuery(
			db.__chain.where.mock.calls[0]?.[0] as never,
		);
		expect(sql).toContain("floor(");
		expect(sql).toContain("workforce_ema");
		expect(params).toEqual(
			expect.arrayContaining([
				COMPANY_SIZE_RANGES["100-149"].min,
				COMPANY_SIZE_RANGES["100-149"].max,
			]),
		);
	});

	// The count feeds the "N résultats" line and the pagination: filtered on a
	// different population, both would describe rows the page never lists.
	it("applies the very same filters to the count query", async () => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({ sizeRange: "250+", status: "cancelled" });

		expect(db.__countChain.where.mock.calls[0]?.[0]).toBe(
			db.__chain.where.mock.calls[0]?.[0],
		);
		expect(renderSql(db.__countChain.where.mock.calls[0]?.[0])).toContain(
			"workforce_ema",
		);
	});

	it("leaves the query unfiltered on the headcount when no bracket is selected", async () => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({ status: "cancelled" });

		expect(renderSql(db.__chain.where.mock.calls[0]?.[0])).not.toContain(
			"workforce_ema",
		);
	});

	it("shapes an in-progress row with its last transmitted step, its next step and the date of that transmission", async () => {
		const db = buildDb([
			{
				...activeRow,
				status: "corrective_actions_chosen",
				lastTransmission: {
					eventType: "path_choice",
					value: "corrective_action",
				},
				lastTransmissionAt: new Date("2026-03-15T10:00:00Z"),
			},
		]);
		const caller = await callSearch(db);

		const [row] = (await caller.search({})).rows;

		expect(row).toMatchObject({
			demarcheStatus: "in_progress",
			lastTransmittedStep: "Choix du parcours — Actions correctives",
			nextStep: "Actions correctives et seconde déclaration",
			statusDate: new Date("2026-03-15T10:00:00Z"),
		});
		expect(row).not.toHaveProperty("lastTransmission");
		expect(row).not.toHaveProperty("lastTransmissionAt");
		expect(row).not.toHaveProperty("demarcheCompletedAt");
	});

	it("shapes a draft with no transmitted step and dates it from its opening", async () => {
		const db = buildDb([
			{
				...activeRow,
				status: "draft",
				lastTransmission: null,
				lastTransmissionAt: null,
			},
		]);
		const caller = await callSearch(db);

		const [row] = (await caller.search({})).rows;

		expect(row).toMatchObject({
			demarcheStatus: "draft",
			lastTransmittedStep: null,
			nextStep: DECLARATION_PROCESS_STEP_LABELS.draft,
			statusDate: activeRow.createdAt,
		});
	});

	it("shapes a completed démarche with no next step, dated from its completion", async () => {
		const db = buildDb([
			{
				...activeRow,
				status: "demarche_completed",
				lastTransmission: { eventType: "cse_opinion_submit", value: null },
				demarcheCompletedAt: new Date("2026-03-20T10:00:00Z"),
			},
		]);
		const caller = await callSearch(db);

		const [row] = (await caller.search({})).rows;

		expect(row).toMatchObject({
			demarcheStatus: "completed",
			lastTransmittedStep: "Dépôt d'un avis CSE",
			nextStep: null,
			statusDate: new Date("2026-03-20T10:00:00Z"),
		});
	});

	it("shapes a cancelled démarche with what it had transmitted, dated from its cancellation", async () => {
		const db = buildDb([cancelledRow]);
		const caller = await callSearch(db);

		const [row] = (await caller.search({})).rows;

		expect(row).toMatchObject({
			demarcheStatus: "cancelled",
			lastTransmittedStep: "Transmission de la déclaration",
			nextStep: null,
			statusDate: cancelledRow.cancelledAt,
		});
	});

	it("ignores a history event that is not a transmission", async () => {
		const db = buildDb([
			{
				...activeRow,
				lastTransmission: { eventType: "step_change", value: null },
			},
		]);
		const caller = await callSearch(db);

		const [row] = (await caller.search({})).rows;

		expect(row?.lastTransmittedStep).toBeNull();
	});

	it("sorts by default on the status date, most recent first, undated rows last, then on the id", async () => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({});

		const [primary, tieBreak] = db.__chain.orderBy.mock.calls[0] ?? [];
		const primarySql = renderSql(primary);
		expect(primarySql).toContain("CASE");
		expect(primarySql).toContain("DESC NULLS LAST");
		expect(renderSql(tieBreak)).toBe('"app_declaration"."id" asc');
	});

	it.each([
		"siren",
		"companyName",
		"year",
		"workforce",
		"demarcheStatus",
		"declarantEmail",
		"statusDate",
	] as const)("breaks ties on the id when sorting by %s", async (sortBy) => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({ sortBy, sortOrder: "asc" });

		const args = db.__chain.orderBy.mock.calls[0] ?? [];
		expect(args).toHaveLength(2);
		expect(renderSql(args[1])).toBe('"app_declaration"."id" asc');
	});

	it.each([
		"asc",
		"desc",
	] as const)("sorts the démarche status %s on its rank", async (sortOrder) => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({ sortBy: "demarcheStatus", sortOrder });

		const orderBy = renderSql(db.__chain.orderBy.mock.calls[0]?.[0]);
		expect(orderBy).toContain("CASE");
		expect(orderBy).toMatch(sortOrder === "asc" ? / ASC$/ : / DESC$/);
	});

	it("filters on the démarche status through the SQL classification", async () => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({ status: "completed" });

		const { sql, params } = dialect.sqlToQuery(
			db.__chain.where.mock.calls[0]?.[0] as never,
		);
		expect(sql).toContain("CASE");
		expect(params).toContain("completed");
	});

	it("bounds the date filter on the status date with the same day bounds as before", async () => {
		const db = buildDb([activeRow]);
		const caller = await callSearch(db);

		await caller.search({ dateFrom: "2027-03-14", dateTo: "2027-03-20" });

		const { sql, params } = dialect.sqlToQuery(
			db.__chain.where.mock.calls[0]?.[0] as never,
		);
		expect(sql).toContain("::timestamptz");
		expect(sql).not.toContain('"app_declaration"."created_at" >=');
		expect(params).toEqual(
			expect.arrayContaining(["2027-03-14T00:00:00Z", "2027-03-20T23:59:59Z"]),
		);
		expect(db.__countChain.where.mock.calls[0]?.[0]).toBe(
			db.__chain.where.mock.calls[0]?.[0],
		);
	});
});
