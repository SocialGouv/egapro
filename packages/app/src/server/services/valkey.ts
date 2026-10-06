import "server-only";

import { createClient, type RedisClientType } from "redis";
import { env } from "~/env";

const CONNECT_TIMEOUT_MS = 1_500;
let valkeyClient: RedisClientType | null = null;
let valkeyConnection: Promise<RedisClientType | null> | null = null;

/**
 * The application's own Valkey client, shared by every server-side consumer
 * (rate limiting, export cache). Resolves to `null` when Valkey is not
 * configured or unreachable: callers fall back rather than fail.
 */
export async function getValkey(): Promise<RedisClientType | null> {
	if (!env.VALKEY_URL) return null;
	if (valkeyClient?.isReady) return valkeyClient;
	if (valkeyConnection) return valkeyConnection;
	valkeyConnection = (async () => {
		let client: RedisClientType | null = null;
		try {
			client = createClient({
				url: env.VALKEY_URL,
				socket: { connectTimeout: CONNECT_TIMEOUT_MS },
			}) as RedisClientType;
			client.on("error", () => undefined);
			client.on("end", () => {
				if (valkeyClient === client) valkeyClient = null;
			});
			await withValkeyTimeout(client.connect(), CONNECT_TIMEOUT_MS);
			valkeyClient = client;
			return valkeyClient;
		} catch {
			client?.destroy();
			return null;
		} finally {
			valkeyConnection = null;
		}
	})();
	return valkeyConnection;
}

/** Drops a client that failed a command, so the next call reconnects. */
export function discardValkey(client: RedisClientType): void {
	if (valkeyClient === client) valkeyClient = null;
	client.destroy();
}

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
