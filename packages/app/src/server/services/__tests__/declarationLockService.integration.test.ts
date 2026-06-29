import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { db } from "~/server/db";
import {
	acquireOrRefreshLock,
	getActiveLock,
	refreshLock,
	releaseAllLocksForUser,
	releaseLock,
	releaseLockAsAdmin,
} from "~/server/services/declarationLockService";

describe("declarationLockService (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "123456789";
	const OTHER_SIREN = "987654321";
	const YEAR = 2025;
	const TIMEOUT_MINUTES = 30;

	const DECLARATION_ID = "lock-it-decl-1";
	const OTHER_DECLARATION_ID = "lock-it-decl-2";

	const UID1 = "lock-it-user-1";
	const UID2 = "lock-it-user-2";
	const EMAIL1 = "lock-it-user-1@example.fr";
	const EMAIL2 = "lock-it-user-2@example.fr";

	async function seedFixtures() {
		await sql`
			INSERT INTO app_user (id, email, first_name, last_name)
			VALUES
				(${UID1}, ${EMAIL1}, 'Alice', 'Martin'),
				(${UID2}, ${EMAIL2}, 'Bob', 'Durand')
		`;
		await sql`
			INSERT INTO app_company (siren, name)
			VALUES (${SIREN}, 'Lock Test Company'), (${OTHER_SIREN}, 'Lock Test Company 2')
		`;
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id)
			VALUES
				(${DECLARATION_ID}, ${SIREN}, ${YEAR}, ${UID1}),
				(${OTHER_DECLARATION_ID}, ${OTHER_SIREN}, ${YEAR}, ${UID1})
		`;
	}

	async function cleanup() {
		await sql`DELETE FROM app_declaration_lock WHERE locked_by_user_id IN (${UID1}, ${UID2})`;
		await sql`DELETE FROM app_declaration WHERE id IN (${DECLARATION_ID}, ${OTHER_DECLARATION_ID})`;
		await sql`DELETE FROM app_company WHERE siren IN (${SIREN}, ${OTHER_SIREN})`;
		await sql`DELETE FROM app_user WHERE id IN (${UID1}, ${UID2})`;
	}

	async function countLockRows(declarationId: string): Promise<number> {
		const rows = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count
			FROM app_declaration_lock
			WHERE declaration_id = ${declarationId}
		`;
		return rows[0]?.count ?? 0;
	}

	async function forceExpiry(declarationId: string, expiresAt: Date) {
		await sql`
			UPDATE app_declaration_lock
			SET expires_at = ${expiresAt}
			WHERE declaration_id = ${declarationId}
		`;
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
		await seedFixtures();
	});

	describe("acquireOrRefreshLock on a free declaration", () => {
		it("acquires the lock, creates a row, and stamps expiry near now + timeout", async () => {
			const before = Date.now();
			const result = await acquireOrRefreshLock(
				db,
				DECLARATION_ID,
				UID1,
				TIMEOUT_MINUTES,
			);
			const after = Date.now();

			expect(result.acquired).toBe(true);
			expect(result.holder.userId).toBe(UID1);
			expect(result.holder.email).toBe(EMAIL1);
			expect(result.holder.firstName).toBe("Alice");
			expect(result.holder.lastName).toBe("Martin");

			expect(await countLockRows(DECLARATION_ID)).toBe(1);

			const expiry = result.holder.expiresAt.getTime();
			expect(expiry).toBeGreaterThanOrEqual(before + TIMEOUT_MINUTES * 60_000);
			expect(expiry).toBeLessThanOrEqual(
				after + TIMEOUT_MINUTES * 60_000 + 1_000,
			);
		});
	});

	describe("acquireOrRefreshLock when another user holds an active lock", () => {
		it("does not acquire and returns the original holder", async () => {
			const first = await acquireOrRefreshLock(
				db,
				DECLARATION_ID,
				UID1,
				TIMEOUT_MINUTES,
			);
			expect(first.acquired).toBe(true);

			const second = await acquireOrRefreshLock(
				db,
				DECLARATION_ID,
				UID2,
				TIMEOUT_MINUTES,
			);

			expect(second.acquired).toBe(false);
			expect(second.holder.userId).toBe(UID1);
			expect(second.holder.email).toBe(EMAIL1);

			expect(await countLockRows(DECLARATION_ID)).toBe(1);
		});
	});

	describe("acquireOrRefreshLock on an expired lock held by another user", () => {
		it("getActiveLock returns null and the new user can take over", async () => {
			await acquireOrRefreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES);
			await forceExpiry(DECLARATION_ID, new Date(Date.now() - 60_000));

			expect(await getActiveLock(db, DECLARATION_ID)).toBeNull();

			const takeover = await acquireOrRefreshLock(
				db,
				DECLARATION_ID,
				UID2,
				TIMEOUT_MINUTES,
			);

			expect(takeover.acquired).toBe(true);
			expect(takeover.holder.userId).toBe(UID2);
			expect(takeover.holder.email).toBe(EMAIL2);
			expect(takeover.holder.expiresAt.getTime()).toBeGreaterThan(Date.now());

			expect(await countLockRows(DECLARATION_ID)).toBe(1);
		});
	});

	describe("acquireOrRefreshLock by the same holder", () => {
		it("refreshes in place without creating a second row and extends expiry", async () => {
			const first = await acquireOrRefreshLock(
				db,
				DECLARATION_ID,
				UID1,
				TIMEOUT_MINUTES,
			);
			await forceExpiry(DECLARATION_ID, new Date(Date.now() + 60_000));

			const refreshed = await acquireOrRefreshLock(
				db,
				DECLARATION_ID,
				UID1,
				TIMEOUT_MINUTES,
			);

			expect(refreshed.acquired).toBe(true);
			expect(refreshed.holder.userId).toBe(UID1);
			expect(await countLockRows(DECLARATION_ID)).toBe(1);
			expect(refreshed.holder.expiresAt.getTime()).toBeGreaterThan(
				first.holder.expiresAt.getTime(),
			);
		});
	});

	describe("getActiveLock", () => {
		it("returns the holder joined with the user details when active", async () => {
			await acquireOrRefreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES);

			const holder = await getActiveLock(db, DECLARATION_ID);

			expect(holder).not.toBeNull();
			expect(holder?.userId).toBe(UID1);
			expect(holder?.email).toBe(EMAIL1);
			expect(holder?.firstName).toBe("Alice");
			expect(holder?.lastName).toBe("Martin");
			expect(holder?.expiresAt).toBeInstanceOf(Date);
		});

		it("returns null when no lock exists for the declaration", async () => {
			expect(await getActiveLock(db, DECLARATION_ID)).toBeNull();
		});

		it("returns null on the exact expiry boundary (expiresAt <= now)", async () => {
			await acquireOrRefreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES);
			await forceExpiry(DECLARATION_ID, new Date());

			expect(await getActiveLock(db, DECLARATION_ID)).toBeNull();
		});
	});

	describe("refreshLock", () => {
		it("extends expiry and returns true when held by the user", async () => {
			const acquired = await acquireOrRefreshLock(
				db,
				DECLARATION_ID,
				UID1,
				TIMEOUT_MINUTES,
			);
			await forceExpiry(DECLARATION_ID, new Date(Date.now() + 60_000));

			const ok = await refreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES);

			expect(ok).toBe(true);
			const holder = await getActiveLock(db, DECLARATION_ID);
			expect(holder?.expiresAt.getTime()).toBeGreaterThan(
				acquired.holder.expiresAt.getTime(),
			);
		});

		it("returns false and does not touch the row when not held by the user", async () => {
			await acquireOrRefreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES);
			const before = await getActiveLock(db, DECLARATION_ID);

			const ok = await refreshLock(db, DECLARATION_ID, UID2, TIMEOUT_MINUTES);

			expect(ok).toBe(false);
			const after = await getActiveLock(db, DECLARATION_ID);
			expect(after?.userId).toBe(UID1);
			expect(after?.expiresAt.getTime()).toBe(before?.expiresAt.getTime());
		});

		it("returns false when no lock exists", async () => {
			expect(await refreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES)).toBe(
				false,
			);
		});
	});

	describe("releaseLock", () => {
		it("removes the lock when held by the user", async () => {
			await acquireOrRefreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES);

			await releaseLock(db, DECLARATION_ID, UID1);

			expect(await countLockRows(DECLARATION_ID)).toBe(0);
		});

		it("leaves another user's lock untouched", async () => {
			await acquireOrRefreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES);

			await releaseLock(db, DECLARATION_ID, UID2);

			expect(await countLockRows(DECLARATION_ID)).toBe(1);
			const holder = await getActiveLock(db, DECLARATION_ID);
			expect(holder?.userId).toBe(UID1);
		});
	});

	describe("releaseAllLocksForUser", () => {
		it("removes every lock held by the user across declarations", async () => {
			await acquireOrRefreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES);
			await acquireOrRefreshLock(
				db,
				OTHER_DECLARATION_ID,
				UID1,
				TIMEOUT_MINUTES,
			);

			await releaseAllLocksForUser(db, UID1);

			expect(await countLockRows(DECLARATION_ID)).toBe(0);
			expect(await countLockRows(OTHER_DECLARATION_ID)).toBe(0);
		});

		it("does not remove locks held by other users", async () => {
			await acquireOrRefreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES);
			await acquireOrRefreshLock(
				db,
				OTHER_DECLARATION_ID,
				UID2,
				TIMEOUT_MINUTES,
			);

			await releaseAllLocksForUser(db, UID1);

			expect(await countLockRows(DECLARATION_ID)).toBe(0);
			expect(await countLockRows(OTHER_DECLARATION_ID)).toBe(1);
		});
	});

	describe("releaseLockAsAdmin", () => {
		it("removes the lock regardless of who holds it", async () => {
			await acquireOrRefreshLock(db, DECLARATION_ID, UID1, TIMEOUT_MINUTES);

			await releaseLockAsAdmin(db, DECLARATION_ID);

			expect(await countLockRows(DECLARATION_ID)).toBe(0);
			expect(await getActiveLock(db, DECLARATION_ID)).toBeNull();
		});
	});
});
