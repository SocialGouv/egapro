import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { db } from "~/server/db";
import {
	acquireOrRefreshRepresentationLock,
	getActiveRepresentationLock,
	refreshRepresentationLock,
} from "~/server/services/representationDeclarationLockService";

describe("representationDeclarationLockService (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "123456782";
	const YEAR = 2026;
	const TIMEOUT_MINUTES = 30;
	const UID1 = "rep-lock-it-user-1";
	const UID2 = "rep-lock-it-user-2";
	const UID3 = "rep-lock-it-user-3";

	async function cleanup() {
		await sql`DELETE FROM app_representation_declaration_lock WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id IN (${UID1}, ${UID2}, ${UID3})`;
	}

	async function countLockRows(): Promise<number> {
		const rows = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count
			FROM app_representation_declaration_lock
			WHERE siren = ${SIREN} AND year = ${YEAR}
		`;
		return rows[0]?.count ?? 0;
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
		await sql`
			INSERT INTO app_user (id, email, first_name, last_name)
			VALUES
				(${UID1}, 'rep-lock-it-user-1@example.fr', 'Alice', 'Martin'),
				(${UID2}, 'rep-lock-it-user-2@example.fr', 'Bob', 'Durand'),
				(${UID3}, 'rep-lock-it-user-3@example.fr', 'Chloé', 'Petit')
		`;
		await sql`INSERT INTO app_company (siren, name) VALUES (${SIREN}, 'Société Démo')`;
	});

	async function raceForLock() {
		const results = await Promise.all([
			acquireOrRefreshRepresentationLock(
				db,
				SIREN,
				YEAR,
				UID2,
				TIMEOUT_MINUTES,
			),
			acquireOrRefreshRepresentationLock(
				db,
				SIREN,
				YEAR,
				UID3,
				TIMEOUT_MINUTES,
			),
		]);
		return {
			winners: results.filter((result) => result.acquired),
			losers: results.filter((result) => !result.acquired),
		};
	}

	it("grants a free declaration to exactly one of two simultaneous callers", async () => {
		const { winners, losers } = await raceForLock();

		expect(winners).toHaveLength(1);
		expect(losers).toHaveLength(1);
		expect(losers[0]?.holder.userId).toBe(winners[0]?.holder.userId);
		expect(await countLockRows()).toBe(1);
	});

	it("grants an expired lock to exactly one of two simultaneous callers", async () => {
		await acquireOrRefreshRepresentationLock(
			db,
			SIREN,
			YEAR,
			UID1,
			TIMEOUT_MINUTES,
		);
		await sql`
			UPDATE app_representation_declaration_lock
			SET expires_at = ${new Date(Date.now() - 60_000)}
			WHERE siren = ${SIREN} AND year = ${YEAR}
		`;

		const { winners, losers } = await raceForLock();

		expect(winners).toHaveLength(1);
		expect(losers).toHaveLength(1);
		expect(winners[0]?.holder.userId).not.toBe(UID1);
		expect(await countLockRows()).toBe(1);
	});

	it("reads the lock timeout from the row and follows the holder's next heartbeat", async () => {
		await acquireOrRefreshRepresentationLock(db, SIREN, YEAR, UID1, 45);
		expect(
			(await getActiveRepresentationLock(db, SIREN, YEAR))?.lockTimeoutMinutes,
		).toBe(45);

		await refreshRepresentationLock(db, SIREN, YEAR, UID1, 10);

		expect(
			(await getActiveRepresentationLock(db, SIREN, YEAR))?.lockTimeoutMinutes,
		).toBe(10);
	});
});
