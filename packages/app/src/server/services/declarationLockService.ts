import "server-only";

import { and, eq, gt, lte, or } from "drizzle-orm";

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

export type LockReadState = {
	isReadOnly: boolean;
	lockHolder: Pick<LockHolder, "firstName" | "lastName" | "email"> | null;
};

/**
 * Resolve the read-only display state of a declaration for `currentUserId`:
 * read-only when an active lock is held by *another* user, exposing only the
 * holder identity the banner needs. Shared by the funnel layouts
 * (`declaration-remuneration`, `avis-cse`) so the lock-read logic lives in one
 * place instead of being duplicated per layout.
 */
export async function getLockReadState(
	db: DbClient,
	declarationId: string,
	currentUserId: string,
): Promise<LockReadState> {
	const activeLock = await getActiveLock(db, declarationId);
	if (!activeLock || activeLock.userId === currentUserId) {
		return { isReadOnly: false, lockHolder: null };
	}

	return {
		isReadOnly: true,
		lockHolder: {
			firstName: activeLock.firstName,
			lastName: activeLock.lastName,
			email: activeLock.email,
		},
	};
}

/**
 * Atomically acquire or refresh the edit lock on a declaration.
 *
 * Uses `INSERT ... ON CONFLICT (declaration_id)` so concurrent callers cannot
 * both win: the conflict update only fires when the existing lock is free to
 * take (held by the same user, or expired). If an active lock is held by
 * another user, the row is left untouched and `acquired` is `false`.
 *
 * The upsert and the holder read run in a single transaction so the returned
 * holder is consistent with the row just written: the row-level lock taken by
 * `INSERT ... ON CONFLICT` is held until commit, so a concurrent caller cannot
 * overwrite the row between the upsert and the `getActiveLock` read. When `db`
 * is already a transaction, Drizzle nests this as a savepoint.
 */
export async function acquireOrRefreshLock(
	db: DbClient,
	declarationId: string,
	userId: string,
	timeoutMinutes: number,
): Promise<{ acquired: boolean; holder: LockHolder }> {
	const now = new Date();
	const expiresAt = computeExpiry(now, timeoutMinutes);

	return (db as DB).transaction(async (tx) => {
		const acquiredRows = await tx
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
				setWhere: or(
					eq(declarationLocks.lockedByUserId, userId),
					lte(declarationLocks.expiresAt, now),
				),
			})
			.returning({ id: declarationLocks.id });

		const holder = await getActiveLock(tx, declarationId);

		if (!holder) {
			throw new Error(
				`Declaration lock row missing right after upsert for ${declarationId}`,
			);
		}

		return { acquired: acquiredRows.length > 0, holder };
	});
}

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

export async function releaseAllLocksForUser(
	db: DbClient,
	userId: string,
): Promise<void> {
	await db
		.delete(declarationLocks)
		.where(eq(declarationLocks.lockedByUserId, userId));
}

// No ownership predicate: admin override, callers gate on the admin role.
export async function releaseLockAsAdmin(
	db: DbClient,
	declarationId: string,
): Promise<void> {
	await db
		.delete(declarationLocks)
		.where(eq(declarationLocks.declarationId, declarationId));
}
