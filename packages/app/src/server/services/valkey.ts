import "server-only";

import { createClient, type RedisClientType } from "redis";
import { env } from "~/env";

const CONNECT_TIMEOUT_MS = 1_500;

export type ValkeyConnection = {
	client(): Promise<RedisClientType | null>;
	discard(client: RedisClientType): void;
};

export function createValkeyConnection(): ValkeyConnection {
	let current: RedisClientType | null = null;
	let pending: Promise<RedisClientType | null> | null = null;

	async function connect(): Promise<RedisClientType | null> {
		let client: RedisClientType | null = null;
		try {
			client = createClient({
				url: env.VALKEY_URL,
				socket: { connectTimeout: CONNECT_TIMEOUT_MS },
			}) as RedisClientType;
			client.on("error", () => undefined);
			client.on("end", () => {
				if (current === client) current = null;
			});
			await withValkeyTimeout(client.connect(), CONNECT_TIMEOUT_MS);
			current = client;
			return current;
		} catch {
			client?.destroy();
			return null;
		}
	}

	return {
		async client() {
			if (!env.VALKEY_URL) return null;
			if (current?.isReady) return current;
			if (current) {
				const stale = current;
				current = null;
				stale.destroy();
			}
			pending ??= connect().finally(() => {
				pending = null;
			});
			return pending;
		},
		discard(client) {
			if (current === client) current = null;
			client.destroy();
		},
	};
}

// Separate sockets: a multi-megabyte export transfer must never delay a rate-limit INCR.
export const rateLimitValkey = createValkeyConnection();
export const exportCacheValkey = createValkeyConnection();

export async function withValkeyTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				timer = setTimeout(
					() => reject(new Error("Valkey command timeout")),
					timeoutMs,
				);
			}),
		]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}
