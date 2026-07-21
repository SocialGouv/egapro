import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockWhere = vi.fn();
const mockInnerJoin2 = vi.fn(() => ({ where: mockWhere }));
const mockLeftJoin = vi.fn(() => ({ innerJoin: mockInnerJoin2 }));
const mockInnerJoin1 = vi.fn(() => ({ leftJoin: mockLeftJoin }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin1 }));
const mockSelect = vi.fn<(fields: Record<string, unknown>) => unknown>(() => ({
	from: mockFrom,
}));

vi.mock("~/server/db", () => ({
	db: { select: (fields: Record<string, unknown>) => mockSelect(fields) },
}));

function compile(condition: SQL | undefined): {
	sql: string;
	params: unknown[];
} {
	if (!condition) {
		throw new Error("no condition to compile");
	}
	const dialect = new PgDialect({ casing: "snake_case" });
	const built = dialect.sqlToQuery(condition);
	return { sql: built.sql, params: built.params };
}

function compileWhere(): { sql: string; params: unknown[] } {
	return compile(mockWhere.mock.calls[0]?.[0] as SQL | undefined);
}

describe("fetchSubmittedDeclarations — composite temporal filter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockWhere.mockResolvedValue([]);
	});

	it("should select cancelledAt alongside the existing columns", async () => {
		const { fetchSubmittedDeclarations } = await import("../queries");
		await fetchSubmittedDeclarations("2025-04-01", "2025-05-01");

		const fields = mockSelect.mock.calls[0]?.[0];
		expect(fields).toBeDefined();
		expect(fields).toHaveProperty("cancelledAt");
	});

	it("should read the SUIT Effectif from gip_mds_data, not from the Weez company workforce (#3929)", async () => {
		const { fetchSubmittedDeclarations } = await import("../queries");
		await fetchSubmittedDeclarations("2025-04-01", "2025-05-01");

		const fields = mockSelect.mock.calls[0]?.[0];
		expect(fields).toHaveProperty("workforceEma");
		expect(fields).not.toHaveProperty("workforce");
	});

	it("should left-join gip_mds_data on siren + year so declarations of companies absent from the GIP file are kept", async () => {
		const { fetchSubmittedDeclarations } = await import("../queries");
		await fetchSubmittedDeclarations("2025-04-01", "2025-05-01");

		expect(mockLeftJoin).toHaveBeenCalledTimes(1);
		const joinCall = mockLeftJoin.mock.calls[0] as unknown as
			| [unknown, SQL]
			| undefined;
		const { sql } = compile(joinCall?.[1]);

		expect(sql).toContain(
			'"app_gip_mds_data"."siren" = "app_declaration"."siren"',
		);
		expect(sql).toContain(
			'"app_gip_mds_data"."year" = "app_declaration"."year"',
		);
	});

	it("should compose an OR with two AND branches: cancelled_at-window OR (non-draft + updated_at-window + cancelled_at IS NULL)", async () => {
		const { fetchSubmittedDeclarations } = await import("../queries");
		await fetchSubmittedDeclarations("2025-04-01", "2025-05-01");

		const { sql, params } = compileWhere();

		expect(sql).toMatch(/\bor\b/i);
		expect(sql).toContain('"cancelled_at" >=');
		expect(sql).toContain('"cancelled_at" <');
		expect(sql).toContain('"status" <>');
		expect(sql).toContain('"updated_at" >=');
		expect(sql).toContain('"updated_at" <');
		expect(sql).toContain('"cancelled_at" is null');
		expect(params).toContain("draft");
		const dateBegin = new Date("2025-04-01T00:00:00Z").toISOString();
		const dateEnd = new Date("2025-05-01T00:00:00Z").toISOString();
		const dateLikeParams = params.filter(
			(p) => p instanceof Date || typeof p === "string",
		);
		const beginCount = dateLikeParams.filter(
			(p) => (p instanceof Date ? p.toISOString() : p) === dateBegin,
		).length;
		const endCount = dateLikeParams.filter(
			(p) => (p instanceof Date ? p.toISOString() : p) === dateEnd,
		).length;
		expect(beginCount).toBe(2);
		expect(endCount).toBe(2);
	});

	it("should not gate the cancelled-window arm on status check", async () => {
		// Annulation tardive d'une déclaration soumise hors fenêtre :
		// le filtre composite doit la capter sans exiger status<>'draft'
		// dans la même conjonction. Le statut n'apparaît que dans l'arm 2.
		const { fetchSubmittedDeclarations } = await import("../queries");
		await fetchSubmittedDeclarations("2025-04-01", "2025-05-01");

		const { sql, params } = compileWhere();

		expect(params.filter((p) => p === "draft")).toHaveLength(1);
		const orIndex = sql.toLowerCase().indexOf(" or ");
		expect(orIndex).toBeGreaterThan(0);
		const beforeOr = sql.slice(0, orIndex).toLowerCase();
		expect(beforeOr).toContain('"cancelled_at" >=');
		expect(beforeOr).not.toContain('"status"');
	});

	it("should keep cancelled_at IS NULL on the active-submission arm to avoid double-counting", async () => {
		// Soumission ET annulation toutes deux dans la fenêtre :
		// la déclaration doit être captée une seule fois. L'arm 2 exclut donc
		// les annulations (cancelled_at IS NULL) que l'arm 1 capture déjà.
		const { fetchSubmittedDeclarations } = await import("../queries");
		await fetchSubmittedDeclarations("2025-04-01", "2025-05-01");

		const { sql } = compileWhere();
		const orIndex = sql.toLowerCase().indexOf(" or ");
		const afterOr = sql.slice(orIndex).toLowerCase();
		expect(afterOr).toContain('"cancelled_at" is null');
		expect(afterOr).toContain('"status"');
	});
});
