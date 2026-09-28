import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
	notCancelledCondition,
	resolveCurrentDeclarationId,
	resolveExportDeclarationId,
	submittedDeclarationCondition,
} from "../declarationConditions";

// Same casing as the app's db instance, so the generated column names match.
const dialect = new PgDialect({ casing: "snake_case" });

// Parity guard: these Drizzle conditions are the SQL mirrors of the domain
// predicates `isDeclarationSubmitted` / `isCancelled`. Assert the generated SQL
// stays aligned with those definitions ("status" <> 'draft' and not cancelled).

describe("submittedDeclarationCondition", () => {
	it("excludes draft declarations (mirror of isDeclarationSubmitted)", () => {
		const { sql, params } = dialect.sqlToQuery(submittedDeclarationCondition());
		expect(sql).toContain("status");
		expect(sql).toMatch(/<>|!=/);
		expect(params).toEqual(["draft"]);
	});
});

describe("notCancelledCondition", () => {
	it("excludes cancelled declarations (mirror of isCancelled)", () => {
		const { sql, params } = dialect.sqlToQuery(notCancelledCondition());
		expect(sql).toContain("cancelled_at");
		expect(sql.toLowerCase()).toContain("is null");
		expect(params).toEqual([]);
	});
});

describe("resolveCurrentDeclarationId", () => {
	function stubDb(rows: { id: string }[]) {
		const captured: { where?: SQL; orderBy?: SQL[] } = {};
		const chain = {
			from: () => chain,
			where: (clause: SQL) => {
				captured.where = clause;
				return chain;
			},
			orderBy: (...clauses: SQL[]) => {
				captured.orderBy = clauses;
				return chain;
			},
			limit: () => Promise.resolve(rows),
		};
		return { db: { select: () => chain }, captured };
	}

	// This ordering is the correctness argument of the lock guard: the guard and
	// `uploadPipeline` each run their own query, and the unique index on
	// (siren, year) is partial, so several cancelled rows may share the pair.
	// The order has to be total — a tie would hand the two lookups different
	// rows, which is the divergence the guard exists to prevent.
	it("orders by active, then most recent, then id to break every tie", async () => {
		const { db, captured } = stubDb([{ id: "decl-1" }]);

		await resolveCurrentDeclarationId(db as never, "123456789", 2026);

		const rendered = (captured.orderBy ?? []).map((clause) =>
			dialect.sqlToQuery(clause).sql.toLowerCase(),
		);
		expect(rendered).toHaveLength(3);
		expect(rendered[0]).toContain("cancelled_at");
		expect(rendered[0]).toContain("is null desc");
		expect(rendered[1]).toContain("created_at");
		expect(rendered[1]).toContain("desc");
		// `createdAt` is nullable and DESC puts NULLs first: an undated row would
		// otherwise outrank every dated one.
		expect(rendered[1]).toContain("nulls last");
		expect(rendered[2]).toContain("id");
		expect(rendered[2]).toContain("desc");
	});

	it("scopes on siren and year without excluding cancelled declarations", async () => {
		const { db, captured } = stubDb([]);

		await resolveCurrentDeclarationId(db as never, "123456789", 2026);

		const { sql, params } = dialect.sqlToQuery(captured.where as SQL);
		expect(sql).toContain("siren");
		expect(sql).toContain("year");
		expect(sql.toLowerCase()).not.toContain("cancelled_at");
		expect(params).toEqual(["123456789", 2026]);
	});

	it("returns the resolved id, or null when the pair has no declaration", async () => {
		const found = stubDb([{ id: "decl-1" }]);
		const empty = stubDb([]);

		await expect(
			resolveCurrentDeclarationId(found.db as never, "123456789", 2026),
		).resolves.toBe("decl-1");
		await expect(
			resolveCurrentDeclarationId(empty.db as never, "123456789", 2026),
		).resolves.toBeNull();
	});
});

describe("resolveExportDeclarationId", () => {
	function stubDb(rows: { id: string; cancelledAt: Date | null }[]) {
		const captured: { where?: SQL; orderBy?: SQL[] } = {};
		const chain = {
			from: () => chain,
			where: (clause: SQL) => {
				captured.where = clause;
				return chain;
			},
			orderBy: (...clauses: SQL[]) => {
				captured.orderBy = clauses;
				return chain;
			},
			limit: () => Promise.resolve(rows),
		};
		return { db: { select: () => chain }, captured };
	}

	// Same total order as `resolveCurrentDeclarationId` — this resolver only
	// adds a stricter `where`, it must not weaken the tie-break.
	it("orders by active, then most recent, then id to break every tie", async () => {
		const { db, captured } = stubDb([{ id: "decl-1", cancelledAt: null }]);

		await resolveExportDeclarationId(db as never, "123456789", 2026);

		const rendered = (captured.orderBy ?? []).map((clause) =>
			dialect.sqlToQuery(clause).sql.toLowerCase(),
		);
		expect(rendered).toHaveLength(3);
		expect(rendered[0]).toContain("cancelled_at");
		expect(rendered[0]).toContain("is null desc");
		expect(rendered[1]).toContain("created_at");
		expect(rendered[1]).toContain("desc");
		expect(rendered[1]).toContain("nulls last");
		expect(rendered[2]).toContain("id");
		expect(rendered[2]).toContain("desc");
	});

	// The defect this resolver fixes: a draft opened after a cancellation
	// (redéclaration en cours) must never win over the submitted declaration
	// it redeclares — unlike `resolveCurrentDeclarationId`, which the write
	// path (upload/lock) deliberately keeps blind to `status`.
	it("scopes on siren and year and excludes draft declarations", async () => {
		const { db, captured } = stubDb([]);

		await resolveExportDeclarationId(db as never, "123456789", 2026);

		const { sql, params } = dialect.sqlToQuery(captured.where as SQL);
		expect(sql).toContain("siren");
		expect(sql).toContain("year");
		expect(sql).toContain("status");
		expect(params).toEqual(["123456789", 2026, "draft"]);
	});

	it("returns the resolved id and cancellation date, or null when no submitted declaration exists", async () => {
		const cancelledAt = new Date("2027-04-01T12:00:00Z");
		const found = stubDb([{ id: "decl-1", cancelledAt }]);
		const empty = stubDb([]);

		await expect(
			resolveExportDeclarationId(found.db as never, "123456789", 2026),
		).resolves.toEqual({ id: "decl-1", cancelledAt });
		await expect(
			resolveExportDeclarationId(empty.db as never, "123456789", 2026),
		).resolves.toBeNull();
	});
});
