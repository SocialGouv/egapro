import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { afterAll, describe, expect, it, vi } from "vitest";
import { captureReport, runCli } from "#scripts/check-postgres-upgrade";
import {
	compareReports,
	parseReport,
	reportProblems,
} from "#scripts/postgres-upgrade-report";

const sql = postgres(process.env.DATABASE_URL ?? "", {
	max: 1,
	onnotice: () => {},
});
const scope = "00000000-0000-4000-8000-000000000001";
afterAll(async () => {
	await sql.end();
});

describe("read-only capture against disposable PostgreSQL", () => {
	it("compares the same migrated application on PostgreSQL 16 and 18", async () => {
		const before = await captureReport(sql, "application", scope);
		const target = await new PostgreSqlContainer("postgres:18").start();
		const targetSql = postgres(target.getConnectionUri(), {
			max: 1,
			onnotice: () => {},
		});
		try {
			await migrate(drizzle(targetSql), { migrationsFolder: "./drizzle" });
			const after = await captureReport(targetSql, "application", scope);
			expect(compareReports(before, after, 18)).toEqual([]);
		} finally {
			await targetSql.end();
			await target.stop();
		}
	}, 120_000);

	it("captures real migrations and exact aggregates without any company data", async () => {
		await sql`INSERT INTO app_company (siren, name) VALUES ('123456789', 'Société Démo')`;
		try {
			const before = await captureReport(sql, "application", scope);
			expect(reportProblems(before)).toEqual([]);
			expect(before.tables.app_company?.rows).toBe("1");
			expect(Number(before.journal?.rows)).toBeGreaterThan(0);
			expect(JSON.stringify(before)).not.toMatch(
				/Société Démo|123456789|postgresql:/,
			);
			expect(
				compareReports(
					before,
					await captureReport(sql, "application", scope),
					Math.floor(before.serverVersion / 10000),
				),
			).toEqual([]);
			await sql`DELETE FROM app_company WHERE siren = '123456789'`;
			expect(
				compareReports(
					before,
					await captureReport(sql, "application", scope),
					Math.floor(before.serverVersion / 10000),
				),
			).toContain(
				"Comptage modifié pendant l’arrêt des écritures : app_company.",
			);
		} finally {
			await sql`DELETE FROM app_company WHERE siren = '123456789'`;
		}
	});
	it("detects column changes and journal loss with safe diagnostics", async () => {
		const before = await captureReport(sql, "application", scope);
		await sql`ALTER TABLE app_company ADD COLUMN upgrade_test_column text`;
		try {
			expect(
				compareReports(
					before,
					await captureReport(sql, "application", scope),
					16,
				),
			).toContain("Structure modifiée : app_company.");
		} finally {
			await sql`ALTER TABLE app_company DROP COLUMN upgrade_test_column`;
		}
		await sql`ALTER TABLE drizzle.__drizzle_migrations RENAME TO upgrade_test_migrations`;
		try {
			expect(
				(await captureReport(sql, "application", scope)).journal,
			).toBeNull();
		} finally {
			await sql`ALTER TABLE drizzle.upgrade_test_migrations RENAME TO __drizzle_migrations`;
		}
	});
	it("detects enum contract changes even when row counts and type names stay identical", async () => {
		const before = await captureReport(sql, "application", scope);
		await sql`ALTER TYPE public.declaration_status RENAME VALUE 'awaiting_compliance_path_choice' TO 'upgrade_test_status'`;
		try {
			expect(
				compareReports(
					before,
					await captureReport(sql, "application", scope),
					16,
				),
			).toContain("Structure modifiée : app_declaration.");
		} finally {
			await sql`ALTER TYPE public.declaration_status RENAME VALUE 'upgrade_test_status' TO 'awaiting_compliance_path_choice'`;
		}
	});

	it("enforces read-only execution at the server and reports a missing critical table", async () => {
		await sql`ALTER TABLE app_export RENAME TO upgrade_test_export`;
		// A malicious/redefined relation cannot induce writes through SELECT.
		await sql`CREATE FUNCTION public.upgrade_test_write() RETURNS integer LANGUAGE plpgsql AS $$ BEGIN INSERT INTO app_company (siren, name) VALUES ('987654321', 'Must not persist'); RETURN 1; END $$`;
		await sql`CREATE VIEW app_export AS SELECT upgrade_test_write() AS result`;
		try {
			await expect(
				captureReport(sql, "application", scope),
			).rejects.toMatchObject({ code: "25006" });
			const rows =
				await sql`SELECT count(*)::text AS count FROM app_company WHERE siren = '987654321'`;
			expect(rows[0]?.count).toBe("0");
			await sql`DROP VIEW app_export`;
			expect(
				reportProblems(await captureReport(sql, "application", scope)),
			).toContain("Table critique absente : app_export.");
		} finally {
			await sql`DROP VIEW IF EXISTS app_export`;
			await sql`DROP FUNCTION public.upgrade_test_write()`;
			await sql`ALTER TABLE upgrade_test_export RENAME TO app_export`;
		}
	});
	it("captures only aggregate pg-boss state when explicitly selected", async () => {
		await sql`CREATE SCHEMA pgboss`;
		await sql`CREATE TABLE pgboss.version (version integer)`;
		await sql`INSERT INTO pgboss.version VALUES (30)`;
		for (const name of ["job", "queue", "schedule", "subscription"])
			await sql`CREATE TABLE ${sql(`pgboss.${name}`)} (payload text)`;
		await sql`INSERT INTO pgboss.job VALUES ('private job content')`;
		try {
			const result = await captureReport(sql, "notifications", scope);
			expect(reportProblems(result)).toEqual([]);
			expect(result.tables.job?.rows).toBe("1");
			expect(JSON.stringify(result)).not.toContain("private job content");
			await sql`UPDATE pgboss.version SET version = 31`;
			expect(
				compareReports(
					result,
					await captureReport(sql, "notifications", scope),
					16,
				),
			).toContain("Journal de migrations modifié.");
		} finally {
			await sql`DROP SCHEMA pgboss CASCADE`;
		}
	});
	it("writes private reports, refuses overwrite and suppresses raw connection errors", async () => {
		const directory = await mkdtemp(join(tmpdir(), "upgrade-integration-"));
		const log = vi.spyOn(console, "log").mockImplementation(() => {});
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			const output = join(directory, "capture.json");
			const args = [
				"capture",
				"--database=application",
				`--scope=${scope}`,
				"--writes-stopped",
				"--output",
				output,
			];
			expect(await runCli(args)).toBe(0);
			const saved = await readFile(output, "utf8");
			expect(reportProblems(parseReport(JSON.parse(saved)))).toEqual([]);
			expect((await stat(output)).mode & 0o777).toBe(0o600);
			expect(await runCli(args)).toBe(1);
			expect(await readFile(output, "utf8")).toBe(saved);
			expect(
				await runCli(args, { DATABASE_URL: "invalid sensitive connection" }),
			).toBe(1);
			expect(error.mock.calls.flat().join(" ")).not.toMatch(
				/sensitive|capture.json|postgresql:/,
			);
		} finally {
			log.mockRestore();
			error.mockRestore();
			await rm(directory, { recursive: true, force: true });
		}
	});
});
