import "server-only";

import { and, eq, gt, inArray, lte, or } from "drizzle-orm";

import type { DB } from "~/server/db";
import { representationDeclarationLocks, users } from "~/server/db/schema";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type RepresentationLockDb = DB | Tx;

export type RepresentationLockHolder = {
	userId: string;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
	expiresAt: Date;
};

const MS_PER_MINUTE = 60_000;

function expiryFrom(now: Date, timeoutMinutes: number): Date {
	return new Date(now.getTime() + timeoutMinutes * MS_PER_MINUTE);
}

export class RepresentationLockConflictError extends Error {
	constructor() {
		super(
			"La déclaration de représentation est verrouillée par une autre personne ou le verrou a expiré.",
		);
		this.name = "RepresentationLockConflictError";
	}
}

export async function getActiveRepresentationLock(
	db: RepresentationLockDb,
	siren: string,
	year: number,
): Promise<RepresentationLockHolder | null> {
	const rows = await db
		.select({
			userId: representationDeclarationLocks.lockedByUserId,
			email: users.email,
			firstName: users.firstName,
			lastName: users.lastName,
			expiresAt: representationDeclarationLocks.expiresAt,
		})
		.from(representationDeclarationLocks)
		.innerJoin(
			users,
			eq(representationDeclarationLocks.lockedByUserId, users.id),
		)
		.where(
			and(
				eq(representationDeclarationLocks.siren, siren),
				eq(representationDeclarationLocks.year, year),
				gt(representationDeclarationLocks.expiresAt, new Date()),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function acquireOrRefreshRepresentationLock(
	db: RepresentationLockDb,
	siren: string,
	year: number,
	userId: string,
	timeoutMinutes: number,
): Promise<{ acquired: boolean; holder: RepresentationLockHolder }> {
	const now = new Date();
	const expiresAt = expiryFrom(now, timeoutMinutes);

	return (db as DB).transaction(async (tx) => {
		const acquiredRows = await tx
			.insert(representationDeclarationLocks)
			.values({
				siren,
				year,
				lockedByUserId: userId,
				lockedAt: now,
				lastHeartbeatAt: now,
				expiresAt,
			})
			.onConflictDoUpdate({
				target: [
					representationDeclarationLocks.siren,
					representationDeclarationLocks.year,
				],
				set: {
					lockedByUserId: userId,
					lockedAt: now,
					lastHeartbeatAt: now,
					expiresAt,
				},
				where: or(
					eq(representationDeclarationLocks.lockedByUserId, userId),
					lte(representationDeclarationLocks.expiresAt, now),
				),
			})
			.returning({ userId: representationDeclarationLocks.lockedByUserId });

		const holder = await getActiveRepresentationLock(tx, siren, year);
		if (!holder) {
			throw new Error(
				`Representation lock missing after acquire for ${siren}/${year}`,
			);
		}
		return {
			acquired: acquiredRows.length > 0 && holder.userId === userId,
			holder,
		};
	});
}

export async function refreshRepresentationLock(
	db: RepresentationLockDb,
	siren: string,
	year: number,
	userId: string,
	timeoutMinutes: number,
): Promise<boolean> {
	const now = new Date();
	const rows = await db
		.update(representationDeclarationLocks)
		.set({ lastHeartbeatAt: now, expiresAt: expiryFrom(now, timeoutMinutes) })
		.where(
			and(
				eq(representationDeclarationLocks.siren, siren),
				eq(representationDeclarationLocks.year, year),
				eq(representationDeclarationLocks.lockedByUserId, userId),
				gt(representationDeclarationLocks.expiresAt, now),
			),
		)
		.returning({ id: representationDeclarationLocks.id });
	return rows.length > 0;
}

export async function releaseRepresentationLock(
	db: RepresentationLockDb,
	siren: string,
	year: number,
	userId: string,
): Promise<boolean> {
	const rows = await db
		.delete(representationDeclarationLocks)
		.where(
			and(
				eq(representationDeclarationLocks.siren, siren),
				eq(representationDeclarationLocks.year, year),
				eq(representationDeclarationLocks.lockedByUserId, userId),
			),
		)
		.returning({ id: representationDeclarationLocks.id });
	return rows.length > 0;
}

export async function assertRepresentationLockHeld(
	db: RepresentationLockDb,
	siren: string,
	year: number,
	userId: string,
): Promise<void> {
	const rows = await db
		.select({
			userId: representationDeclarationLocks.lockedByUserId,
			expiresAt: representationDeclarationLocks.expiresAt,
		})
		.from(representationDeclarationLocks)
		.where(
			and(
				eq(representationDeclarationLocks.siren, siren),
				eq(representationDeclarationLocks.year, year),
			),
		)
		.for("update")
		.limit(1);
	const lock = rows[0];
	const now = new Date();
	if (!lock || lock.expiresAt <= now || lock.userId !== userId) {
		throw new RepresentationLockConflictError();
	}
}

export async function releaseAllRepresentationLocksForUser(
	db: RepresentationLockDb,
	userId: string,
): Promise<void> {
	await db
		.delete(representationDeclarationLocks)
		.where(eq(representationDeclarationLocks.lockedByUserId, userId));
}

export async function releaseRepresentationLocksForUserOnSirens(
	db: RepresentationLockDb,
	userId: string,
	sirens: string[],
): Promise<void> {
	if (sirens.length === 0) return;
	await db
		.delete(representationDeclarationLocks)
		.where(
			and(
				eq(representationDeclarationLocks.lockedByUserId, userId),
				inArray(representationDeclarationLocks.siren, sirens),
			),
		);
}
