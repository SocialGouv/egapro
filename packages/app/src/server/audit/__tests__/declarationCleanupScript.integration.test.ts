/**
 * Integration test for `scripts/declaration-cleanup.mjs` — runs against the
 * real Postgres container booted by `src/test/integration-setup.ts`.
 *
 * Why this exists as an integration test (issue #3769):
 *  The RGPD purge bypasses the drizzle schema and runs ordered raw DELETEs
 *  inside a single `postgres` transaction across eight tables, plus a
 *  best-effort S3 side-effect and a self-audit insert. Only a real database
 *  proves the FK-safe ordering, the cascade of `status_history`/`lock`, and
 *  the atomic rollback — a mocked driver would hide all of it.
 *
 * The `.mjs` script is a standalone CLI entry — we import its exported core
 * routine and drive it with our own `sql` client (never spawning `node`) and a
 * mocked `deleteObject` so no real S3 is touched. `logFailure` + the failure
 * audit row live in the un-exported `isMain` CLI wrapper, so this test locks
 * the testable contract: the atomic rollback and the success self-audit.
 */

import postgres from "postgres";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mock,
} from "vitest";
import { runDeclarationCleanup } from "#scripts/declaration-cleanup.mjs";
import { env } from "~/env.js";

const ACTION = "system.declaration_cleanup";
const SIREN = "123456789";
const USER_ID = "test-decl-cleanup-user";
const USER_EMAIL = "test-decl-cleanup@example.fr";
// 2026 − 6 (default retention) ⇒ cutoffYear 2020: year < 2020 is purged.
const NOW = new Date("2026-06-15T00:00:00Z");
const RETENTION = 6;

describe("declaration-cleanup.mjs (integration)", () => {
	let sql!: ReturnType<typeof postgres>;
	let deleteObject: Mock<(key: string) => Promise<void>>;

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
		deleteObject = vi.fn<(key: string) => Promise<void>>(async () => undefined);
	});

	async function cleanup() {
		// The S6 guard table holds a RESTRICT FK on app_declaration — drop it
		// first so the declaration deletes below are not blocked.
		await sql`DROP TABLE IF EXISTS _tu_decl_guard`;
		await sql`
			DELETE FROM app_employee_category
			WHERE job_category_id IN (
				SELECT id FROM app_job_category
				WHERE declaration_id IN (SELECT id FROM app_declaration WHERE siren = ${SIREN})
			)
		`;
		await sql`DELETE FROM app_job_category WHERE declaration_id IN (SELECT id FROM app_declaration WHERE siren = ${SIREN})`;
		await sql`DELETE FROM app_cse_opinion_file WHERE declaration_id IN (SELECT id FROM app_declaration WHERE siren = ${SIREN})`;
		await sql`DELETE FROM app_cse_opinion WHERE declaration_id IN (SELECT id FROM app_declaration WHERE siren = ${SIREN})`;
		await sql`DELETE FROM app_file WHERE declaration_id IN (SELECT id FROM app_declaration WHERE siren = ${SIREN})`;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await sql`DELETE FROM audit.action_log WHERE action = ${ACTION}`;
	}

	async function seedCompanyAndUser() {
		await sql`INSERT INTO app_user (id, email) VALUES (${USER_ID}, ${USER_EMAIL})`;
		await sql`INSERT INTO app_company (siren, name) VALUES (${SIREN}, 'Société Démo')`;
	}

	async function seedDeclaration(year: number, suffix: string) {
		const declId = `decl-${suffix}`;
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id)
			VALUES (${declId}, ${SIREN}, ${year}, ${USER_ID})
		`;
		return declId;
	}

	// Seeds a declaration with one row in every declaration-scoped child table
	// (job/employee category, cse_opinion, two files, cse_opinion_file,
	// status_history, lock). Returns the declaration id and its two S3 keys.
	async function seedDeclarationTree(year: number, suffix: string) {
		const declId = await seedDeclaration(year, suffix);
		const jobCategoryId = `jc-${suffix}`;
		const cseFileId = `file-cse-${suffix}`;
		const evalFileId = `file-eval-${suffix}`;
		const cseKey = `${SIREN}/${year}/avis-cse-${suffix}.pdf`;
		const evalKey = `${SIREN}/${year}/evaluation-${suffix}.pdf`;

		await sql`
			INSERT INTO app_job_category (id, declaration_id, category_index, name, source)
			VALUES (${jobCategoryId}, ${declId}, 0, 'Cadres', 'manual')
		`;
		await sql`
			INSERT INTO app_employee_category (id, job_category_id, declaration_type)
			VALUES (${`ec-${suffix}`}, ${jobCategoryId}, 'initial')
		`;
		await sql`
			INSERT INTO app_cse_opinion (id, declaration_id, declaration_number, type)
			VALUES (${`co-${suffix}`}, ${declId}, 1, 'accuracy')
		`;
		await sql`
			INSERT INTO app_file (id, declaration_id, file_name, file_path, type, uploaded_at)
			VALUES (${cseFileId}, ${declId}, 'avis.pdf', ${cseKey}, 'cse_opinion', now())
		`;
		await sql`
			INSERT INTO app_file (id, declaration_id, file_name, file_path, type, uploaded_at)
			VALUES (${evalFileId}, ${declId}, 'evaluation.pdf', ${evalKey}, 'joint_evaluation', now())
		`;
		await sql`
			INSERT INTO app_cse_opinion_file (id, declaration_id, declaration_number, type, file_id)
			VALUES (${`cof-${suffix}`}, ${declId}, 1, 'accuracy', ${cseFileId})
		`;
		await sql`
			INSERT INTO app_declaration_status_history (id, declaration_id, event_type, created_at)
			VALUES (${`sh-${suffix}`}, ${declId}, 'submit', now())
		`;
		await sql`
			INSERT INTO app_declaration_lock (id, declaration_id, locked_by_user_id, locked_at, last_heartbeat_at, expires_at)
			VALUES (${`lk-${suffix}`}, ${declId}, ${USER_ID}, now(), now(), now() + interval '1 hour')
		`;

		return { declId, keys: [cseKey, evalKey] };
	}

	async function countDeclaration(declId: string): Promise<number> {
		const rows = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count FROM app_declaration WHERE id = ${declId}
		`;
		return rows[0]?.count ?? 0;
	}

	async function countByDeclaration(
		table: string,
		declId: string,
	): Promise<number> {
		const rows = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count FROM ${sql(table)} WHERE declaration_id = ${declId}
		`;
		return rows[0]?.count ?? 0;
	}

	async function countEmployeeCategories(declId: string): Promise<number> {
		const rows = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count FROM app_employee_category
			WHERE job_category_id IN (
				SELECT id FROM app_job_category WHERE declaration_id = ${declId}
			)
		`;
		return rows[0]?.count ?? 0;
	}

	async function getSelfAudit() {
		const rows = await sql<
			[{ status: string; metadata: Record<string, unknown> }]
		>`
			SELECT status, metadata FROM audit.action_log
			WHERE action = ${ACTION}
			ORDER BY created_at DESC
			LIMIT 1
		`;
		return rows[0];
	}

	async function countAuditByStatus(status: string): Promise<number> {
		const rows = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count FROM audit.action_log
			WHERE action = ${ACTION} AND status = ${status}
		`;
		return rows[0]?.count ?? 0;
	}

	it("purges a declaration whose year is beyond retention, with its S3 objects (S1)", async () => {
		await seedCompanyAndUser();
		const { declId, keys } = await seedDeclarationTree(2015, "s1");

		const result = await runDeclarationCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
			deleteObject,
		});

		expect(result).toEqual({
			purgedDeclarations: 1,
			purgedFiles: 2,
			purgedS3Objects: 2,
			failedS3Objects: 0,
		});
		expect(await countDeclaration(declId)).toBe(0);
		expect(deleteObject).toHaveBeenCalledTimes(2);
		expect(deleteObject).toHaveBeenCalledWith(keys[0]);
		expect(deleteObject).toHaveBeenCalledWith(keys[1]);
	});

	it("keeps a declaration whose year is still within retention (S2)", async () => {
		await seedCompanyAndUser();
		const { declId } = await seedDeclarationTree(2024, "s2");

		const result = await runDeclarationCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
			deleteObject,
		});

		expect(result.purgedDeclarations).toBe(0);
		expect(result.purgedFiles).toBe(0);
		expect(await countDeclaration(declId)).toBe(1);
		expect(await countByDeclaration("app_file", declId)).toBe(2);
		expect(deleteObject).not.toHaveBeenCalled();
	});

	it("leaves no orphan in any attached table after a purge (S3)", async () => {
		await seedCompanyAndUser();
		const { declId } = await seedDeclarationTree(2015, "s3");

		await runDeclarationCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
			deleteObject,
		});

		expect(await countDeclaration(declId)).toBe(0);
		expect(await countByDeclaration("app_file", declId)).toBe(0);
		expect(await countByDeclaration("app_job_category", declId)).toBe(0);
		expect(await countEmployeeCategories(declId)).toBe(0);
		expect(await countByDeclaration("app_cse_opinion", declId)).toBe(0);
		expect(await countByDeclaration("app_cse_opinion_file", declId)).toBe(0);
		// status_history and lock are removed by FK cascade, not an explicit DELETE.
		expect(
			await countByDeclaration("app_declaration_status_history", declId),
		).toBe(0);
		expect(await countByDeclaration("app_declaration_lock", declId)).toBe(0);
	});

	it("is a no-op and idempotent when nothing is eligible (S5)", async () => {
		await seedCompanyAndUser();
		const { declId } = await seedDeclarationTree(2025, "s5");

		const first = await runDeclarationCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
			deleteObject,
		});
		const second = await runDeclarationCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
			deleteObject,
		});

		expect(first).toEqual({
			purgedDeclarations: 0,
			purgedFiles: 0,
			purgedS3Objects: 0,
			failedS3Objects: 0,
		});
		expect(second).toEqual(first);
		expect(await countDeclaration(declId)).toBe(1);
		expect(deleteObject).not.toHaveBeenCalled();
		// Each run still records its success self-audit.
		expect(await countAuditByStatus("success")).toBe(2);
	});

	it("purges year = cutoff − 1 but keeps year = cutoff at the exact boundary (S7)", async () => {
		await seedCompanyAndUser();
		const keptId = await seedDeclaration(2020, "s7-kept");
		const purgedId = await seedDeclaration(2019, "s7-purged");

		const result = await runDeclarationCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
			deleteObject,
		});

		expect(result.purgedDeclarations).toBe(1);
		expect(await countDeclaration(keptId)).toBe(1);
		expect(await countDeclaration(purgedId)).toBe(0);
	});

	it("rolls back the whole purge atomically when a delete fails mid-transaction (S6)", async () => {
		await seedCompanyAndUser();
		const { declId } = await seedDeclarationTree(2015, "s6");
		// Force a real mid-transaction failure: a RESTRICT FK on the parent makes
		// the final `DELETE FROM app_declaration` throw, exercising the rollback.
		await sql`
			CREATE TABLE _tu_decl_guard (
				decl_id varchar(255) NOT NULL REFERENCES app_declaration(id) ON DELETE RESTRICT
			)
		`;
		await sql`INSERT INTO _tu_decl_guard (decl_id) VALUES (${declId})`;

		try {
			await expect(
				runDeclarationCleanup({
					sql,
					retentionYears: RETENTION,
					now: NOW,
					deleteObject,
				}),
			).rejects.toThrow();

			// Nothing partially deleted — declaration and every child remain.
			expect(await countDeclaration(declId)).toBe(1);
			expect(await countByDeclaration("app_file", declId)).toBe(2);
			expect(await countByDeclaration("app_job_category", declId)).toBe(1);
			expect(await countEmployeeCategories(declId)).toBe(1);
			expect(await countByDeclaration("app_cse_opinion", declId)).toBe(1);
			expect(await countByDeclaration("app_cse_opinion_file", declId)).toBe(1);
			// No success self-audit is written when the transaction aborts.
			expect(await countAuditByStatus("success")).toBe(0);
			// S3 deletion only runs after a successful commit.
			expect(deleteObject).not.toHaveBeenCalled();
		} finally {
			await sql`DROP TABLE IF EXISTS _tu_decl_guard`;
		}
	});

	it("still purges the database when an S3 object delete fails (non-fatal)", async () => {
		await seedCompanyAndUser();
		const { declId } = await seedDeclarationTree(2015, "s3fail");
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		deleteObject
			.mockRejectedValueOnce(new Error("S3 unavailable"))
			.mockResolvedValueOnce(undefined);

		const result = await runDeclarationCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
			deleteObject,
		});

		expect(result.purgedDeclarations).toBe(1);
		expect(result.purgedS3Objects).toBe(1);
		expect(result.failedS3Objects).toBe(1);
		expect(deleteObject).toHaveBeenCalledTimes(2);
		// DB purge is committed regardless of the S3 outcome.
		expect(await countDeclaration(declId)).toBe(0);
		expect(consoleError).toHaveBeenCalled();
		consoleError.mockRestore();
	});

	it("writes a success self-audit row holding only counter metadata, no PII (S6 trace + RGPD)", async () => {
		await seedCompanyAndUser();
		await seedDeclarationTree(2015, "audit");

		await runDeclarationCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
			deleteObject,
		});

		const selfAudit = await getSelfAudit();
		expect(selfAudit?.status).toBe("success");
		expect(selfAudit?.metadata).toEqual({
			purgedDeclarations: 1,
			purgedFiles: 2,
			purgedS3Objects: 2,
			failedS3Objects: 0,
			retentionYears: RETENTION,
			cutoffYear: 2020,
		});
	});

	it("records a success self-audit even when the database is empty", async () => {
		const result = await runDeclarationCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
			deleteObject,
		});

		expect(result).toEqual({
			purgedDeclarations: 0,
			purgedFiles: 0,
			purgedS3Objects: 0,
			failedS3Objects: 0,
		});
		expect(await countAuditByStatus("success")).toBe(1);
	});

	it("respects a custom retention window when computing the cutoff", async () => {
		await seedCompanyAndUser();
		// retentionYears 3 ⇒ cutoffYear 2023: 2022 purged, 2023 kept.
		const purgedId = await seedDeclaration(2022, "ret-purged");
		const keptId = await seedDeclaration(2023, "ret-kept");

		const result = await runDeclarationCleanup({
			sql,
			retentionYears: 3,
			now: NOW,
			deleteObject,
		});

		expect(result.purgedDeclarations).toBe(1);
		expect(await countDeclaration(purgedId)).toBe(0);
		expect(await countDeclaration(keptId)).toBe(1);
	});
});
