import type postgres from "postgres";

type Settled<T> =
	| { status: "fulfilled"; value: T }
	| { status: "rejected"; reason: unknown };

async function waitForBlockedBackend(observer: postgres.Sql) {
	for (let attempt = 0; attempt < 200; attempt++) {
		const rows = await observer`
			SELECT 1 FROM pg_stat_activity
			WHERE datname = current_database() AND wait_event_type = 'Lock'
		`;
		if (rows.length > 0) return true;
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
	return false;
}

// Commits `underLock` only once `request` is seen waiting on the lock, so the
// request can only decide from what it reads after acquiring it.
export async function runWhileDeclarationLockHeld<T>({
	observer,
	holder,
	declarationId,
	underLock,
	request,
}: {
	observer: postgres.Sql;
	holder: postgres.Sql;
	declarationId: string;
	underLock: (tx: postgres.TransactionSql) => Promise<unknown>;
	request: () => Promise<T>;
}): Promise<{ blocked: boolean; outcome: Settled<T> }> {
	let releaseHolder!: () => void;
	const holderMayCommit = new Promise<void>((resolve) => {
		releaseHolder = resolve;
	});
	let holderHasLock!: () => void;
	const holderLocked = new Promise<void>((resolve) => {
		holderHasLock = resolve;
	});

	const holding = holder.begin(async (tx) => {
		await tx`SELECT pg_advisory_xact_lock(hashtextextended(${declarationId}, 0))`;
		await underLock(tx);
		holderHasLock();
		await holderMayCommit;
	});

	await holderLocked;
	const settled = request().then(
		(value): Settled<T> => ({ status: "fulfilled", value }),
		(reason: unknown): Settled<T> => ({ status: "rejected", reason }),
	);
	const blocked = await waitForBlockedBackend(observer);
	releaseHolder();
	await holding;
	return { blocked, outcome: await settled };
}
