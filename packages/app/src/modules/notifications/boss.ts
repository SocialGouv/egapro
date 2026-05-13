import "server-only";

import { PgBoss } from "pg-boss";

import { env } from "~/env";

export const NOTIFICATION_QUEUE_NAME = "email-notification";

const RETRY_AFTER_FAILURE_MS = 30_000;

let cachedBoss: PgBoss | null = null;
let cachedPromise: Promise<PgBoss | null> | null = null;
let lastFailureAt: number | null = null;

async function buildAndStart(connectionString: string): Promise<PgBoss> {
	const boss = new PgBoss({
		connectionString,
		// Fail fast when the queue DB is unreachable so a tRPC request never
		// blocks on a flaky infra. pg-boss inherits these timings from the
		// underlying `pg` pool.
		application_name: "egapro-app-publisher",
		// pg-boss maintenance defaults are fine — we are publish-only on this
		// side, the worker process owns the heavy lifting.
	});
	boss.on("error", (error) => {
		console.error("[notifications] pg-boss runtime error:", error);
	});
	await boss.start();
	// Idempotent — guarantees the queue exists even if the worker hasn't
	// booted yet. Safe on every call: pg-boss no-ops when already present.
	await boss.createQueue(NOTIFICATION_QUEUE_NAME);
	return boss;
}

export async function getBoss(): Promise<PgBoss | null> {
	const url = env.NOTIFICATIONS_DATABASE_URL;
	if (!url) return null;

	if (cachedBoss) return cachedBoss;

	if (
		lastFailureAt !== null &&
		Date.now() - lastFailureAt < RETRY_AFTER_FAILURE_MS
	) {
		return null;
	}

	if (cachedPromise) return cachedPromise;

	cachedPromise = (async () => {
		try {
			const boss = await buildAndStart(url);
			cachedBoss = boss;
			lastFailureAt = null;
			return boss;
		} catch (error) {
			console.error("[notifications] failed to start pg-boss:", error);
			lastFailureAt = Date.now();
			return null;
		} finally {
			cachedPromise = null;
		}
	})();

	return cachedPromise;
}
