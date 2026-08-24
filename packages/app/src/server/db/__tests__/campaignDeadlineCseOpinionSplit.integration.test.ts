import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";

// Runnable proof of the #4217 migration backfill, which no unit test can reach:
// `integration-setup.ts` applies the migrations to an EMPTY container, so both
// UPDATE statements below touch zero rows there and the asymmetric backfill is
// never exercised. This file replays the real migration file against a scratch
// schema holding the pre-migration table shape plus rows that already existed,
// which is the only state where the backfill does anything.
//
// The asymmetry is the whole point: the value stored in
// `decl2_joint_evaluation_deadline` was entered by an admin under the pre-#4217
// « Date limite de l'avis du CSE » label, so it must MOVE to the new CSE column
// (keeping the CSE screens unchanged) while the joint evaluation column is
// RECOMPUTED on the new rule — carrying the old value over would silently
// reproduce the bug on every already-configured year.

const MIGRATION_FILE = "0047_volatile_harpoon.sql";
const SCRATCH_SCHEMA = "migration_4217";
const NEW_COLUMN = "decl2_cse_opinion_deadline";

const SEED_YEAR = 2100;
const OTHER_YEAR = 2077;
// The date an admin had entered under the old, CSE-labelled field.
const LEGACY_DECL2_DEADLINE = "2101-02-01";
const OTHER_LEGACY_DECL2_DEADLINE = "2078-02-01";
const FILLER = "2000-01-01";

type DeadlineRow = {
	year: number;
	jointEvaluation: string;
	cseOpinion: string;
};

function toIsoDate(value: Date | string): string {
	return typeof value === "string" ? value : value.toISOString().slice(0, 10);
}

describe("#4217 campaign deadline split — migration backfill (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;
	let statements: string[] = [];

	async function readMigrationStatements(): Promise<string[]> {
		// `drizzle/` sits outside `src/`, so it has no `~/` alias; vitest always
		// runs from the package root.
		const file = path.join(process.cwd(), "drizzle", MIGRATION_FILE);
		const content = await readFile(file, "utf8");
		return content
			.split("--> statement-breakpoint")
			.map((statement) => statement.trim())
			.filter((statement) => statement.length > 0);
	}

	async function seedPreMigrationTable() {
		await sql.unsafe(`DROP SCHEMA IF EXISTS ${SCRATCH_SCHEMA} CASCADE`);
		await sql.unsafe(`CREATE SCHEMA ${SCRATCH_SCHEMA}`);
		// Copying the live table and dropping the added column reproduces the exact
		// pre-migration shape without restating the schema here, so this test cannot
		// drift from `schema.ts`.
		await sql.unsafe(`
			CREATE TABLE ${SCRATCH_SCHEMA}.app_campaign_deadline
			(LIKE public.app_campaign_deadline INCLUDING ALL)
		`);
		await sql.unsafe(`
			ALTER TABLE ${SCRATCH_SCHEMA}.app_campaign_deadline DROP COLUMN ${NEW_COLUMN}
		`);
	}

	async function insertLegacyRow(year: number, decl2Deadline: string) {
		await sql`
			INSERT INTO ${sql(SCRATCH_SCHEMA)}.app_campaign_deadline (
				year,
				decl1_modification_deadline, decl1_justification_deadline, decl1_joint_evaluation_deadline,
				decl2_modification_deadline, decl2_justification_deadline, decl2_joint_evaluation_deadline
			)
			VALUES (
				${year},
				${FILLER}, ${FILLER}, ${FILLER},
				${FILLER}, ${FILLER}, ${decl2Deadline}
			)
		`;
	}

	async function applyMigration() {
		// `search_path` makes the migration's unqualified "app_campaign_deadline"
		// resolve to the scratch copy, so the file runs verbatim.
		await sql.unsafe(`SET search_path TO ${SCRATCH_SCHEMA}`);
		for (const statement of statements) {
			await sql.unsafe(statement);
		}
		await sql.unsafe("SET search_path TO public");
	}

	async function readRow(year: number): Promise<DeadlineRow> {
		const rows = await sql<
			[
				{
					year: number;
					jointEvaluation: Date | string;
					cseOpinion: Date | string;
				},
			]
		>`
			SELECT
				year,
				decl2_joint_evaluation_deadline AS "jointEvaluation",
				decl2_cse_opinion_deadline AS "cseOpinion"
			FROM ${sql(SCRATCH_SCHEMA)}.app_campaign_deadline
			WHERE year = ${year}
		`;
		const row = rows[0];
		return {
			year: row.year,
			jointEvaluation: toIsoDate(row.jointEvaluation),
			cseOpinion: toIsoDate(row.cseOpinion),
		};
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		statements = await readMigrationStatements();
	});

	afterAll(async () => {
		if (!sql) return;
		await sql.unsafe(`DROP SCHEMA IF EXISTS ${SCRATCH_SCHEMA} CASCADE`);
		await sql.end();
	});

	beforeEach(async () => {
		await seedPreMigrationTable();
		await insertLegacyRow(SEED_YEAR, LEGACY_DECL2_DEADLINE);
		await insertLegacyRow(OTHER_YEAR, OTHER_LEGACY_DECL2_DEADLINE);
	});

	it("reads a migration file that still carries every backfill statement", () => {
		expect(statements).toHaveLength(4);
		expect(statements[0]).toContain(`ADD COLUMN "${NEW_COLUMN}"`);
		expect(statements[3]).toContain("SET NOT NULL");
	});

	it("starts from a table that does not have the CSE opinion column yet", async () => {
		const columns = await sql<{ columnName: string }[]>`
			SELECT column_name AS "columnName"
			FROM information_schema.columns
			WHERE table_schema = ${SCRATCH_SCHEMA}
				AND table_name = 'app_campaign_deadline'
		`;
		const names = columns.map((column) => column.columnName);
		expect(names).toContain("decl2_joint_evaluation_deadline");
		expect(names).not.toContain(NEW_COLUMN);
	});

	it("moves the legacy value onto the CSE opinion column so CSE screens keep their date", async () => {
		await applyMigration();

		expect((await readRow(SEED_YEAR)).cseOpinion).toBe(LEGACY_DECL2_DEADLINE);
		expect((await readRow(OTHER_YEAR)).cseOpinion).toBe(
			OTHER_LEGACY_DECL2_DEADLINE,
		);
	});

	it("recomputes the joint evaluation deadline to January 1st of year + 1", async () => {
		await applyMigration();

		expect((await readRow(SEED_YEAR)).jointEvaluation).toBe("2101-01-01");
		expect((await readRow(OTHER_YEAR)).jointEvaluation).toBe("2078-01-01");
	});

	it("leaves the two round-2 deadlines holding different dates", async () => {
		await applyMigration();

		const row = await readRow(SEED_YEAR);
		expect(row.jointEvaluation).not.toBe(row.cseOpinion);
		// The legacy value survives on the CSE column only — never on both.
		expect(row.jointEvaluation).not.toBe(LEGACY_DECL2_DEADLINE);
	});

	it("ends with a NOT NULL CSE opinion column", async () => {
		await applyMigration();

		const columns = await sql<[{ isNullable: string }]>`
			SELECT is_nullable AS "isNullable"
			FROM information_schema.columns
			WHERE table_schema = ${SCRATCH_SCHEMA}
				AND table_name = 'app_campaign_deadline'
				AND column_name = ${NEW_COLUMN}
		`;
		expect(columns[0]?.isNullable).toBe("NO");

		await expect(
			sql`
				INSERT INTO ${sql(SCRATCH_SCHEMA)}.app_campaign_deadline (
					year,
					decl1_modification_deadline, decl1_justification_deadline, decl1_joint_evaluation_deadline,
					decl2_modification_deadline, decl2_justification_deadline, decl2_joint_evaluation_deadline
				)
				VALUES (
					2099,
					${FILLER}, ${FILLER}, ${FILLER},
					${FILLER}, ${FILLER}, ${FILLER}
				)
			`,
		).rejects.toThrow();
	});

	it("is idempotent enough to survive a replay on an already-migrated row", async () => {
		await applyMigration();
		const afterFirst = await readRow(SEED_YEAR);

		// The CSE backfill is guarded by `WHERE decl2_cse_opinion_deadline IS NULL`,
		// so a replay must not overwrite it with the recomputed January date.
		await sql.unsafe(`SET search_path TO ${SCRATCH_SCHEMA}`);
		for (const statement of statements.slice(1, 3)) {
			await sql.unsafe(statement);
		}
		await sql.unsafe("SET search_path TO public");

		expect(await readRow(SEED_YEAR)).toStrictEqual(afterFirst);
	});
});
