/**
 * Integration test for `scripts/user-cleanup.ts` — runs against the real
 * Postgres container booted by `src/test/integration-setup.ts`.
 *
 * Why an integration test: the sweep is raw SQL over `app_user` and the three
 * tables that carry a foreign key to it (company links, both edit locks), then
 * a self-audit insert in another schema. Only a real database proves the
 * boundary is strict, that declarations survive, and that the anonymised
 * address frees the original one.
 */

import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { logUserCleanupFailure, runUserCleanup } from "#scripts/user-cleanup";
import { env } from "~/env.js";

const ACTION = "system.user_cleanup";
const SIREN = "123456789";
const RETENTION = 2;
// 2026 − 2 ⇒ cutoff 2024-06-15T00:00:00Z. The boundary is strict.
const NOW = new Date("2026-06-15T00:00:00Z");

const USER_PREFIX = "test-user-cleanup-";
const userA = `${USER_PREFIX}a`;
const userB = `${USER_PREFIX}b`;
const userC = `${USER_PREFIX}c`;
const userD = `${USER_PREFIX}d`;

describe("user-cleanup.mjs (integration)", () => {
	let sql!: ReturnType<typeof postgres>;

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
		await sql`
			INSERT INTO app_company (siren, name)
			VALUES (${SIREN}, 'Société Démo')
			ON CONFLICT (siren) DO NOTHING
		`;
	});

	async function cleanup() {
		await sql`DELETE FROM app_user_company WHERE user_id LIKE ${`${USER_PREFIX}%`}`;
		await sql`DELETE FROM app_declaration_lock WHERE locked_by_user_id LIKE ${`${USER_PREFIX}%`}`;
		await sql`DELETE FROM app_representation_declaration_lock WHERE locked_by_user_id LIKE ${`${USER_PREFIX}%`}`;
		await sql`DELETE FROM app_declaration WHERE declarant_id LIKE ${`${USER_PREFIX}%`}`;
		await sql`DELETE FROM app_user WHERE id LIKE ${`${USER_PREFIX}%`}`;
		await sql`DELETE FROM audit.action_log WHERE action = ${ACTION}`;
	}

	async function seedUser(
		id: string,
		lastActivityAt: Date,
		options: { isAdmin?: boolean } = {},
	) {
		await sql`
			INSERT INTO app_user (id, email, first_name, last_name, phone, is_admin, last_activity_at)
			VALUES (
				${id},
				${`${id}@example.test`},
				'Camille',
				'Martin',
				'0600000000',
				${options.isAdmin ?? false},
				${lastActivityAt}
			)
		`;
		await sql`
			INSERT INTO app_user_company (user_id, siren)
			VALUES (${id}, ${SIREN})
		`;
		return `${id}@example.test`;
	}

	async function seedDeclaration(id: string, declarantId: string) {
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id)
			VALUES (${id}, ${SIREN}, 2025, ${declarantId})
		`;
	}

	async function seedDeclarationLock(declarationId: string, userId: string) {
		await sql`
			INSERT INTO app_declaration_lock (id, declaration_id, locked_by_user_id, locked_at, last_heartbeat_at, expires_at)
			VALUES (
				${`lk-${userId}`}, ${declarationId}, ${userId}, now(), now(), now() + interval '1 hour'
			)
		`;
	}

	async function getUser(id: string) {
		const rows = await sql<
			[
				{
					email: string;
					first_name: string | null;
					last_name: string | null;
					phone: string | null;
					is_admin: boolean;
					anonymized_at: Date | null;
				},
			]
		>`
			SELECT email, first_name, last_name, phone, is_admin, anonymized_at
			FROM app_user WHERE id = ${id}
		`;
		return rows[0];
	}

	async function countCompanyLinks(userId: string): Promise<number> {
		const rows = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count FROM app_user_company WHERE user_id = ${userId}
		`;
		return rows[0]?.count ?? 0;
	}

	async function countLocks(userId: string): Promise<number> {
		const rows = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count
			FROM app_declaration_lock WHERE locked_by_user_id = ${userId}
		`;
		return rows[0]?.count ?? 0;
	}

	async function declarantOf(declarationId: string) {
		const rows = await sql<{ declarant_id: string }[]>`
			SELECT declarant_id FROM app_declaration WHERE id = ${declarationId}
		`;
		return rows[0]?.declarant_id;
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

	async function waitForBlockedSweep(): Promise<void> {
		for (let attempt = 0; attempt < 200; attempt++) {
			const rows = await sql<{ blocked: number }[]>`
				SELECT count(*)::int AS blocked
				FROM pg_stat_activity
				WHERE application_name = 'user-cleanup-race'
					AND wait_event_type = 'Lock'
					AND query LIKE '%UPDATE app_user%'
			`;
			if ((rows[0]?.blocked ?? 0) > 0) return;
			await new Promise((resolve) => setTimeout(resolve, 25));
		}
		throw new Error("The sweep never blocked on the app_user row lock");
	}

	it("anonymises an account inactive for longer than the window, and keeps its declaration (S1)", async () => {
		// 25 months before NOW.
		const email = await seedUser(userA, new Date("2024-05-15T00:00:00Z"));
		await seedDeclaration("decl-s1", userA);
		await seedDeclarationLock("decl-s1", userA);

		const result = await runUserCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
		});

		expect(result.anonymizedAccounts).toBe(1);

		const user = await getUser(userA);
		expect(user?.first_name).toBeNull();
		expect(user?.last_name).toBeNull();
		expect(user?.phone).toBeNull();
		expect(user?.is_admin).toBe(false);
		expect(user?.email).toBe(`compte-supprime-${userA}@invalid`);
		expect(user?.anonymized_at).toBeInstanceOf(Date);

		expect(await countCompanyLinks(userA)).toBe(0);
		expect(await countLocks(userA)).toBe(0);
		// The legal declaration survives, still attributable to the row.
		expect(await declarantOf("decl-s1")).toBe(userA);

		// The original address is free again for a fresh sign-up.
		await sql`
			INSERT INTO app_user (id, email)
			VALUES (${`${userA}-again`}, ${email})
		`;
	});

	it("keeps an account active inside the window (S2)", async () => {
		await seedUser(userB, new Date("2024-07-15T00:00:00Z"));

		const result = await runUserCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
		});

		expect(result.anonymizedAccounts).toBe(0);
		const user = await getUser(userB);
		expect(user?.first_name).toBe("Camille");
		expect(user?.anonymized_at).toBeNull();
	});

	it("keeps an account whose last activity is exactly at the boundary (S3)", async () => {
		await seedUser(userC, new Date("2024-06-15T00:00:00Z"));

		const result = await runUserCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
		});

		expect(result.anonymizedAccounts).toBe(0);
		expect((await getUser(userC))?.anonymized_at).toBeNull();
	});

	it("is idempotent: a second run anonymises nobody and still writes an audit row (S4)", async () => {
		await seedUser(userA, new Date("2024-05-15T00:00:00Z"));

		await runUserCleanup({ sql, retentionYears: RETENTION, now: NOW });
		const second = await runUserCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
		});

		expect(second.anonymizedAccounts).toBe(0);
		const audit = await getSelfAudit();
		expect(audit?.status).toBe("success");
		expect(audit?.metadata).toMatchObject({
			anonymizedAccounts: 0,
			retentionYears: RETENTION,
			dryRun: false,
		});
	});

	it("anonymises administrators too: the grant comes from configuration (S5)", async () => {
		await seedUser(userD, new Date("2024-05-15T00:00:00Z"), {
			isAdmin: true,
		});

		await runUserCleanup({ sql, retentionYears: RETENTION, now: NOW });

		expect((await getUser(userD))?.is_admin).toBe(false);
	});

	it("skips an account whose sign-in commits between the SELECT and the UPDATE (S8)", async () => {
		await seedUser(userB, new Date("2024-01-15T00:00:00Z"));

		const sweepSql = postgres(env.DATABASE_URL, {
			max: 1,
			connection: { application_name: "user-cleanup-race" },
		});
		const blocker = postgres(env.DATABASE_URL, { max: 1 });
		let sweep: ReturnType<typeof runUserCleanup> | undefined;

		try {
			await blocker.begin(async (tx) => {
				await tx`SELECT id FROM app_user WHERE id = ${userB} FOR UPDATE`;
				sweep = runUserCleanup({
					sql: sweepSql,
					retentionYears: RETENTION,
					now: NOW,
				});
				void sweep.catch(() => undefined);
				await waitForBlockedSweep();
				await tx`UPDATE app_user SET last_activity_at = ${NOW} WHERE id = ${userB}`;
			});

			if (!sweep) throw new Error("Sweep was never started");
			expect((await sweep).anonymizedAccounts).toBe(0);
		} finally {
			await blocker.end();
			await sweep?.catch(() => undefined);
			await sweepSql.end();
		}

		expect((await getUser(userB))?.anonymized_at).toBeNull();
		expect(await countCompanyLinks(userB)).toBe(1);
	});

	it("changes nothing in dry-run mode but reports the candidates (S6)", async () => {
		await seedUser(userA, new Date("2024-05-15T00:00:00Z"));

		const result = await runUserCleanup({
			sql,
			retentionYears: RETENTION,
			now: NOW,
			dryRun: true,
		});

		expect(result.anonymizedAccounts).toBe(1);
		expect(result.dryRun).toBe(true);
		expect((await getUser(userA))?.anonymized_at).toBeNull();
		expect((await getUser(userA))?.first_name).toBe("Camille");
		expect((await getSelfAudit())?.metadata).toMatchObject({ dryRun: true });
	});

	it("records a failure row with a controlled code, without the original error (S7)", async () => {
		await logUserCleanupFailure(sql, new Error("connection refused"));

		const rows = await sql<{ status: string; error_message: string }[]>`
			SELECT status, error_message FROM audit.action_log
			WHERE action = ${ACTION}
			ORDER BY created_at DESC
			LIMIT 1
		`;

		expect(rows[0]?.status).toBe("failure");
		expect(rows[0]?.error_message).toBe("USER_CLEANUP_FAILED");
	});
});
