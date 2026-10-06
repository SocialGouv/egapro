import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "~/env";
import { discardValkey, getValkey, withValkeyTimeout } from "./valkey";

const WINDOW_SECONDS = 60;
const REDIS_TIMEOUT_MS = 1_500;
const MAX_MEMORY_BUCKETS = 50_000;
const anonymousHits = new Map<string, { count: number; expiresAt: number }>();
let lastMemorySweep = 0;

function configuredTokens(): string[] {
	return (env.EGAPRO_PUBLIC_API_TOKENS ?? "")
		.split(",")
		.map((token) => token.trim())
		.filter(Boolean);
}

function sha256(value: string): Buffer {
	return createHash("sha256").update(value).digest();
}

// Fixed-length digests, every token compared, no early exit: timing reveals nothing about a near match.
function isConfiguredToken(candidate: string): boolean {
	const candidateDigest = sha256(candidate);
	let matched = false;
	for (const token of configuredTokens()) {
		matched = timingSafeEqual(candidateDigest, sha256(token)) || matched;
	}
	return matched;
}

function fingerprint(value: string): string {
	return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function clientAddress(headers: Headers): string {
	const forwardedFor = headers.get("x-forwarded-for");
	return (
		headers.get("x-real-ip")?.trim() ||
		forwardedFor?.split(",").at(-1)?.trim() ||
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
	const redis = await getValkey();
	if (redis) {
		try {
			const redisKey = `public-api-rate:${key}`;
			const count = await withValkeyTimeout(
				redis.eval(
					"local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count",
					{ keys: [redisKey], arguments: [String(WINDOW_SECONDS)] },
				),
				REDIS_TIMEOUT_MS,
			);
			return Number(count);
		} catch {
			discardValkey(redis);
		}
	}
	return incrementMemory(key);
}

export const PUBLIC_API_INVALID_TOKEN_MESSAGE = "Jeton d’API invalide.";
export const PUBLIC_API_RATE_LIMITED_MESSAGE =
	"Quota d’appels dépassé. Réessayez dans une minute.";

export type PublicApiRateLimitVerdict = "allowed" | "invalid_token" | "limited";

export async function checkPublicApiRateLimit(
	headers: Headers,
): Promise<PublicApiRateLimitVerdict> {
	const authorization = headers.get("authorization");
	const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
	if (bearer && !isConfiguredToken(bearer)) return "invalid_token";
	const quota = bearer ? 1_200 : 120;
	const identity = bearer
		? `token:${fingerprint(bearer)}`
		: `ip:${fingerprint(clientAddress(headers))}`;
	const bucket = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
	const count = await increment(`${identity}:${bucket}`);
	return count <= quota ? "allowed" : "limited";
}

export async function enforcePublicApiRateLimit(
	request: Request,
): Promise<Response | null> {
	const verdict = await checkPublicApiRateLimit(request.headers);
	if (verdict === "allowed") return null;
	if (verdict === "invalid_token") {
		return Response.json(
			{ error: PUBLIC_API_INVALID_TOKEN_MESSAGE },
			{ status: 401, headers: { "Access-Control-Allow-Origin": "*" } },
		);
	}
	return Response.json(
		{ error: PUBLIC_API_RATE_LIMITED_MESSAGE },
		{
			status: 429,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Retry-After": String(WINDOW_SECONDS),
			},
		},
	);
}
