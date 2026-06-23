import "server-only";

import { and, eq, gt, sql } from "drizzle-orm";

import type { DB } from "~/server/db";
import { declarationLocks, users } from "~/server/db/schema";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

export type DbClient = DB | Tx;

export type LockHolder = {
	userId: string;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
	expiresAt: Date;
};

const MS_PER_MINUTE = 60_000;

function computeExpiry(now: Date, timeoutMinutes: number): Date {
	return new Date(now.getTime() + timeoutMinutes * MS_PER_MINUTE);
}

/**
 * Return the active lock holder for a declaration, or `null` if there is no
 * lock or the lock has expired. Expiry is lazy: an expired row is treated as a
 * free declaration rather than being eagerly deleted.
 */
export async function getActiveLock(
	db: DbClient,
	declarationId: string,
): Promise<LockHolder | null> {
	const rows = await db
		.select({
			userId: declarationLocks.lockedByUserId,
			email: users.email,
			firstName: users.firstName,
			lastName: users.lastName,
			expiresAt: declarationLocks.expiresAt,
		})
		.from(declarationLocks)
		.innerJoin(users, eq(declarationLocks.lockedByUserId, users.id))
		.where(
			and(
				eq(declarationLocks.declarationId, declarationId),
				gt(declarationLocks.expiresAt, new Date()),
			),
		)
		.limit(1);

	return rows[0] ?? null;
}

/**
 * Atomically acquire or refresh the edit lock on a declaration.
 *
 * Uses `INSERT ... ON CONFLICT (declaration_id)` so concurrent callers cannot
 * both win: the conflict update only fires when the existing lock is free to
 * take (held by the same user, or expired). If an active lock is held by
 * another user, the row is left untouched and `acquired` is `false`.
 */
export async function acquireOrRefreshLock(
	db: DbClient,
	declarationId: string,
	userId: string,
	timeoutMinutes: number,
): Promise<{ acquired: boolean; holder: LockHolder }> {
	const now = new Date();
	const expiresAt = computeExpiry(now, timeoutMinutes);

	const acquiredRows = await db
		.insert(declarationLocks)
		.values({
			declarationId,
			lockedByUserId: userId,
			lockedAt: now,
			lastHeartbeatAt: now,
			expiresAt,
		})
		.onConflictDoUpdate({
			target: declarationLocks.declarationId,
			set: {
				lockedByUserId: userId,
				lastHeartbeatAt: now,
				expiresAt,
			},
			setWhere: sql`${declarationLocks.lockedByUserId} = ${userId} or ${declarationLocks.expiresAt} <= ${now}`,
		})
		.returning({ id: declarationLocks.id });

	const holder = await getActiveLock(db, declarationId);

	if (!holder) {
		throw new Error(
			`Declaration lock row missing right after upsert for ${declarationId}`,
		);
	}

	return { acquired: acquiredRows.length > 0, holder };
}

/**
 * Extend the lock's expiry and heartbeat if it is held by `userId`. Returns
 * `false` when the user does not currently hold the lock.
 */
export async function refreshLock(
	db: DbClient,
	declarationId: string,
	userId: string,
	timeoutMinutes: number,
): Promise<boolean> {
	const now = new Date();
	const updated = await db
		.update(declarationLocks)
		.set({
			lastHeartbeatAt: now,
			expiresAt: computeExpiry(now, timeoutMinutes),
		})
		.where(
			and(
				eq(declarationLocks.declarationId, declarationId),
				eq(declarationLocks.lockedByUserId, userId),
			),
		)
		.returning({ id: declarationLocks.id });

	return updated.length > 0;
}

/** Release the lock on a declaration if it is held by `userId`. */
export async function releaseLock(
	db: DbClient,
	declarationId: string,
	userId: string,
): Promise<void> {
	await db
		.delete(declarationLocks)
		.where(
			and(
				eq(declarationLocks.declarationId, declarationId),
				eq(declarationLocks.lockedByUserId, userId),
			),
		);
}

/** Release every lock held by `userId` (e.g. on logout). */
export async function releaseAllLocksForUser(
	db: DbClient,
	userId: string,
): Promise<void> {
	await db
		.delete(declarationLocks)
		.where(eq(declarationLocks.lockedByUserId, userId));
}

/** Release the lock on a declaration unconditionally (admin override). */
export async function releaseLockAsAdmin(
	db: DbClient,
	declarationId: string,
): Promise<void> {
	await db
		.delete(declarationLocks)
		.where(eq(declarationLocks.declarationId, declarationId));
}
