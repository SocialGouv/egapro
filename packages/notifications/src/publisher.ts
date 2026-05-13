import { PgBoss } from "pg-boss";

import { resolvePgUrl } from "./db.js";
import type {
	NotificationPayloadMap,
	NotificationType,
} from "./mails/types.js";
import { QUEUE_NAME } from "./queue.js";

export type EnqueueInput<T extends NotificationType = NotificationType> = {
	type: T;
	recipientEmail: string;
	recipientUserId: string | null;
	siren?: string | null;
	payload: NotificationPayloadMap[T];
	scheduledFor?: Date;
};

export type PublishResult =
	| { status: "enqueued"; id: string }
	| { status: "error"; error: string };

export type EnqueueResult = PublishResult | { status: "queue_unavailable" };

const RETRY_AFTER_FAILURE_MS = 30_000;
const DEFAULT_RETRY_LIMIT = 5;
const DEFAULT_RETRY_DELAY_SECONDS = 60;

let cachedBoss: PgBoss | null = null;
let cachedPromise: Promise<PgBoss | null> | null = null;
let lastFailureAt: number | null = null;

async function buildAndStart(connectionString: string): Promise<PgBoss> {
	const boss = new PgBoss({
		connectionString,
		application_name: "egapro-app-publisher",
	});
	boss.on("error", (error) => {
		console.error("[notifications] pg-boss runtime error:", error);
	});
	await boss.start();
	await boss.createQueue(QUEUE_NAME);
	return boss;
}

async function getPublisher(): Promise<PgBoss | null> {
	const url = resolvePgUrl(
		process.env.NOTIFICATIONS_DATABASE_URL,
		"NOTIFICATIONS_",
	);
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

function readPositiveInt(name: string, fallback: number): number {
	const raw = process.env[name];
	if (!raw) return fallback;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Publish a notification job to the pg-boss queue.
 *
 * Reads `NOTIFICATIONS_DATABASE_URL` (or `NOTIFICATIONS_POSTGRES_*` k8s vars),
 * `NOTIFICATIONS_RETRY_LIMIT` (default 5), and `NOTIFICATIONS_RETRY_DELAY_SECONDS`
 * (default 60) directly from `process.env` — the caller does not need to wire
 * env config.
 *
 * Graceful degradation:
 * - URL missing or queue unreachable → `{ status: "queue_unavailable" }` (no throw)
 * - `boss.send` throws → `{ status: "error", error }` (no throw)
 *
 * Audit logging is the caller's responsibility: branch on the returned
 * `status` and invoke whatever audit sink fits the calling context.
 */
export async function enqueueNotification<T extends NotificationType>(
	input: EnqueueInput<T>,
): Promise<EnqueueResult> {
	const boss = await getPublisher();
	if (!boss) return { status: "queue_unavailable" };

	const jobData = {
		type: input.type,
		payload: input.payload,
		recipientEmail: input.recipientEmail,
		recipientUserId: input.recipientUserId,
		siren: input.siren ?? null,
	};
	const startAfterSeconds = input.scheduledFor
		? Math.max(
				0,
				Math.floor((input.scheduledFor.getTime() - Date.now()) / 1000),
			)
		: 0;

	try {
		const jobId = await boss.send(QUEUE_NAME, jobData, {
			retryLimit: readPositiveInt(
				"NOTIFICATIONS_RETRY_LIMIT",
				DEFAULT_RETRY_LIMIT,
			),
			retryBackoff: true,
			retryDelay: readPositiveInt(
				"NOTIFICATIONS_RETRY_DELAY_SECONDS",
				DEFAULT_RETRY_DELAY_SECONDS,
			),
			startAfter: startAfterSeconds,
		});
		return { status: "enqueued", id: jobId ?? "" };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return { status: "error", error: message };
	}
}

/**
 * Reset the cached boss singleton — test-only hook to clear module state
 * between integration scenarios.
 */
export function __resetPublisherForTests(): void {
	cachedBoss = null;
	cachedPromise = null;
	lastFailureAt = null;
}
