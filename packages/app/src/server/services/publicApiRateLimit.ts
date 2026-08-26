import "server-only";

import { createHash } from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import { env } from "~/env";

const WINDOW_SECONDS = 60;
const REDIS_TIMEOUT_MS = 1_500;
const MAX_MEMORY_BUCKETS = 50_000;
const anonymousHits = new Map<string, { count: number; expiresAt: number }>();
let redisClient: RedisClientType | null = null;
let redisConnection: Promise<RedisClientType | null> | null = null;
let lastMemorySweep = 0;

function configuredTokens(): Set<string> {
	return new Set(
		(env.EGAPRO_PUBLIC_API_TOKENS ?? "")
			.split(",")
			.map((token) => token.trim())
			.filter(Boolean),
	);
}

async function getRedis(): Promise<RedisClientType | null> {
	if (!env.VALKEY_URL) return null;
	if (redisClient?.isReady) return redisClient;
	if (redisConnection) return redisConnection;
	redisConnection = (async () => {
		let client: RedisClientType | null = null;
		try {
			client = createClient({
				url: env.VALKEY_URL,
				socket: { connectTimeout: REDIS_TIMEOUT_MS },
			}) as RedisClientType;
			client.on("error", () => undefined);
			client.on("end", () => {
				if (redisClient === client) redisClient = null;
			});
			await withTimeout(client.connect(), REDIS_TIMEOUT_MS);
			redisClient = client;
			return redisClient;
		} catch {
			client?.destroy();
			return null;
		} finally {
			redisConnection = null;
		}
	})();
	return redisConnection;
}

async function withTimeout<T>(
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

function fingerprint(value: string): string {
	return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function clientAddress(request: Request): string {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip") ||
		"unknown"
	);
}

function incrementMemory(key: string): number {
	const now = Date.now();
	if (
		now - lastMemorySweep >= WINDOW_SECONDS * 1000 ||
		anonymousHits.size >= MAX_MEMORY_BUCKETS
	) {
		for (const [storedKey, value] of anonymousHits) {
			if (value.expiresAt <= now) anonymousHits.delete(storedKey);
		}
		lastMemorySweep = now;
	}
	while (anonymousHits.size >= MAX_MEMORY_BUCKETS) {
		const oldestKey = anonymousHits.keys().next().value;
		if (oldestKey === undefined) break;
		anonymousHits.delete(oldestKey);
	}
	const hit = anonymousHits.get(key);
	if (!hit || hit.expiresAt <= now) {
		anonymousHits.set(key, {
			count: 1,
			expiresAt: now + WINDOW_SECONDS * 1000,
		});
		return 1;
	}
	hit.count += 1;
	return hit.count;
}

async function increment(key: string): Promise<number> {
	const redis = await getRedis();
	if (redis) {
		try {
			const redisKey = `public-api-rate:${key}`;
			const count = await withTimeout(
				redis.eval(
					"local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count",
					{ keys: [redisKey], arguments: [String(WINDOW_SECONDS)] },
				),
				REDIS_TIMEOUT_MS,
			);
			return Number(count);
		} catch {
			if (redisClient === redis) redisClient = null;
			redis.destroy();
		}
	}
	return incrementMemory(key);
}

export async function enforcePublicApiRateLimit(
	request: Request,
): Promise<Response | null> {
	const authorization = request.headers.get("authorization");
	const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
	const tokens = configuredTokens();
	if (bearer && !tokens.has(bearer)) {
		return Response.json(
			{ error: "Jeton d’API invalide." },
			{ status: 401, headers: { "Access-Control-Allow-Origin": "*" } },
		);
	}
	const authenticated = bearer !== undefined;
	const quota = authenticated ? 1_200 : 120;
	const identity = bearer
		? `token:${fingerprint(bearer)}`
		: `ip:${fingerprint(clientAddress(request))}`;
	const bucket = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
	const count = await increment(`${identity}:${bucket}`);
	if (count <= quota) return null;
	return Response.json(
		{ error: "Quota d’appels dépassé. Réessayez dans une minute." },
		{
			status: 429,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Retry-After": String(WINDOW_SECONDS),
			},
		},
	);
}
