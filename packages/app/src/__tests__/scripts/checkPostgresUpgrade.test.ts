import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "#scripts/check-postgres-upgrade";
import {
	APPLICATION_TABLES,
	compareReports,
	NOTIFICATION_TABLES,
	parseReport,
	reportProblems,
	type UpgradeReport,
} from "#scripts/postgres-upgrade-report";

function report(
	database: UpgradeReport["database"] = "application",
): UpgradeReport {
	return {
		format: 1,
		scope: "00000000-0000-4000-8000-000000000001",
		database,
		writesStopped: true,
		capturedAt: "2026-10-13T12:00:00.000Z",
		serverVersion: 140017,
		tables: Object.fromEntries(
			(database === "application"
				? APPLICATION_TABLES
				: NOTIFICATION_TABLES
			).map((name) => [
				name,
				{ present: true, rows: "9007199254740993", structure: "a".repeat(32) },
			]),
		),
		journal: { rows: "42", digest: "b".repeat(32) },
	};
}

afterEach(() => vi.restoreAllMocks());

describe("upgrade report comparison", () => {
	it.each([
		"application",
		"notifications",
	] as const)("accepts only the expected server version change for %s", (database) => {
		const before = report(database);
		expect(
			compareReports(before, { ...before, serverVersion: 180001 }, 18),
		).toEqual([]);
		expect(compareReports(before, before, 14)).toEqual([]);
		expect(
			compareReports(
				{ ...before, capturedAt: "2026-10-13T12:00:00Z" },
				before,
				14,
			),
		).toEqual([]);
		expect(compareReports(before, before, 18)).toContain(
			"La version serveur ne correspond pas à la cible attendue.",
		);
	});
	it("detects lost and changed structures, counts and migration history", () => {
		const before = report();
		const after = report();
		after.tables.app_company = { present: false, rows: null, structure: null };
		after.journal = { rows: "42", digest: "c".repeat(32) };
		expect(compareReports(before, after, 14)).toEqual(
			expect.arrayContaining([
				"Table critique absente : app_company.",
				"Structure modifiée : app_company.",
				"Comptage modifié pendant l’arrêt des écritures : app_company.",
				"Journal de migrations modifié.",
			]),
		);
	});
	it.each([
		"9007199254740992",
		"9007199254740994",
	])("detects count changes beyond JS safe integers: %s", (rows) => {
		const after = report();
		after.tables.app_company = {
			present: true,
			rows,
			structure: "a".repeat(32),
		};
		expect(compareReports(report(), after, 14)).toEqual([
			"Comptage modifié pendant l’arrêt des écritures : app_company.",
		]);
	});
	it("rejects empty journals even in two identical reports", () => {
		for (const journal of [null, { rows: "0", digest: "b".repeat(32) }]) {
			expect(reportProblems({ ...report(), journal })).toEqual([
				"Journal de migrations absent ou vide.",
			]);
		}
	});
	it("rejects differing scope/database and reversed capture order", () => {
		expect(
			compareReports(
				report(),
				{ ...report(), scope: "00000000-0000-4000-8000-000000000002" },
				14,
			),
		).toEqual(["Les captures concernent des périmètres différents."]);
		expect(compareReports(report(), report("notifications"), 14)).toHaveLength(
			1,
		);
		expect(
			compareReports(
				report(),
				{ ...report(), capturedAt: "2026-10-12T12:00:00.000Z" },
				14,
			),
		).toEqual(["Les captures ne sont pas dans l’ordre chronologique."]);
	});
	it.each([NaN, 9, 100, 14.5])("rejects an invalid target %s", (target) => {
		expect(() => compareReports(report(), report(), target)).toThrow(
			"Version majeure attendue invalide.",
		);
	});
	it("rejects malformed or incomplete reports without echoing values", () => {
		const missing = report();
		delete missing.tables.app_company;
		for (const value of [
			null,
			{},
			missing,
			{ ...report(), scope: "sensitive-value" },
			{ ...report(), writesStopped: false },
			{ ...report(), extra: "secret" },
			{
				...report(),
				tables: {
					...report().tables,
					unexpected: { present: true, rows: "0", structure: "a".repeat(32) },
				},
			},
		]) {
			expect(() => parseReport(value)).toThrow(
				"Rapport invalide ou incompatible.",
			);
		}
		for (const state of [
			{ present: true, rows: null, structure: null },
			{ present: false, rows: "0", structure: null },
			{ present: false, rows: null, structure: "a".repeat(32) },
			{ present: true, rows: "-1", structure: "bad" },
		]) {
			expect(() =>
				parseReport({
					...report(),
					tables: { ...report().tables, app_company: state },
				}),
			).toThrow("Rapport invalide ou incompatible.");
		}
	});
});

describe("offline CLI and safe failures", () => {
	it.for([
		[],
		["unknown"],
		["compare", "--unknown=sensitive-value"],
		["capture"],
		[
			"capture",
			"--database=notifications",
			"--scope=00000000-0000-4000-8000-000000000001",
			"--writes-stopped",
			"--output=unused",
		],
		[
			"capture",
			"--database=application",
			"--scope=00000000-0000-4000-8000-000000000001",
			"--writes-stopped",
			"--output=unused",
		],
		[
			"compare",
			"--before=secret-file",
			"--after=secret-file",
			"--expected-major=18",
		],
	])("fails safely for %j", async (args) => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		expect(await runCli(args, {})).toBe(1);
		expect(error.mock.calls.flat().join(" ")).not.toMatch(
			/sensitive-value|secret-file/,
		);
	});
	it("compares files without any connection and propagates failure exit codes", async () => {
		const directory = await mkdtemp(join(tmpdir(), "postgres-check-"));
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			const before = join(directory, "before.json");
			const after = join(directory, "after.json");
			await writeFile(before, JSON.stringify(report()));
			await writeFile(
				after,
				JSON.stringify({ ...report(), serverVersion: 180001 }),
			);
			const args = [
				"compare",
				"--before",
				before,
				"--after",
				after,
				"--expected-major",
				"18",
			];
			expect(await runCli(args, {})).toBe(0);
			expect(await runCli([...args, "--database=application"], {})).toBe(1);
			expect(await runCli(["compare"], {})).toBe(1);
			await writeFile(after, JSON.stringify({ ...report(), journal: null }));
			expect(await runCli(args, {})).toBe(1);
			await writeFile(after, "not json: sensitive-value");
			expect(await runCli(args, {})).toBe(1);
			expect(await readFile(before, "utf8")).toBe(JSON.stringify(report()));
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	});
});
