import "server-only";

import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";
import type { PublicSearchInput } from "~/modules/public-api";
import { exportCacheValkey, withValkeyTimeout } from "./valkey";

const TTL_SECONDS = 3_600;
const COMMAND_TIMEOUT_MS = 5_000;
const HOURLY_BYTE_BUDGET = 64 * 1024 * 1024;
const MAX_ENTRY_BYTES = 16 * 1024 * 1024;
const KEY_PREFIX = "public-export:v1";
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const inflight = new Map<string, Promise<string | Response>>();

export type PublicExportDataset = "declarations" | "representations";

function normalizedFacet(values: readonly string[] | undefined) {
	return values ? [...new Set(values)].sort() : null;
}

function exportFilters(input: PublicSearchInput) {
	return [
		input.q ?? null,
		input.city ?? null,
		normalizedFacet(input.region),
		normalizedFacet(input.departement),
		normalizedFacet(input.naf),
		normalizedFacet(input.workforceRanges),
		input.workforceMin ?? null,
		input.workforceMax ?? null,
		input.year ?? null,
	];
}

export function publicExportCacheKey(
	dataset: PublicExportDataset,
	format: string,
	input: PublicSearchInput,
): string {
	const digest = createHash("sha256")
		.update(JSON.stringify(exportFilters(input)))
		.digest("hex");
	return `${KEY_PREFIX}:${dataset}:${format}:${digest}`;
}

function logCacheFailure(operation: string, error: unknown) {
	console.error(
		`[publicExportCache] ${operation}`,
		error instanceof Error ? error.message : "unknown error",
	);
}

async function readCachedExport(key: string): Promise<string | null> {
	const valkey = await exportCacheValkey.client();
	if (!valkey) return null;
	let payload: string | null;
	try {
		payload = await withValkeyTimeout(valkey.get(key), COMMAND_TIMEOUT_MS);
	} catch (error) {
		logCacheFailure("read", error);
		exportCacheValkey.discard(valkey);
		return null;
	}
	if (payload === null) return null;
	try {
		return (await gunzipAsync(Buffer.from(payload, "base64"))).toString("utf8");
	} catch (error) {
		logCacheFailure("decode", error);
		return null;
	}
}

async function storeCachedExport(
	key: string,
	body: string,
	unfiltered: boolean,
): Promise<void> {
	const valkey = await exportCacheValkey.client();
	if (!valkey) return;
	let payload: string;
	try {
		payload = (await gzipAsync(body)).toString("base64");
	} catch (error) {
		logCacheFailure("compress", error);
		return;
	}
	// The unfiltered exports are a handful of keys bounded by MAX_EXPORT_ROWS: always worth caching.
	if (!unfiltered && payload.length > MAX_ENTRY_BYTES) return;
	const hour = Math.floor(Date.now() / (TTL_SECONDS * 1000));
	try {
		if (!unfiltered) {
			const used = await withValkeyTimeout(
				valkey.eval(
					"local used = redis.call('INCRBY', KEYS[1], ARGV[1]); if used == tonumber(ARGV[1]) then redis.call('EXPIRE', KEYS[1], ARGV[2]); end; return used",
					{
						keys: [`${KEY_PREFIX}:budget:${hour}`],
						arguments: [String(payload.length), String(2 * TTL_SECONDS)],
					},
				),
				COMMAND_TIMEOUT_MS,
			);
			if (Number(used) > HOURLY_BYTE_BUDGET) return;
		}
		await withValkeyTimeout(
			valkey.set(key, payload, { EX: TTL_SECONDS }),
			COMMAND_TIMEOUT_MS,
		);
	} catch (error) {
		logCacheFailure("write", error);
		exportCacheValkey.discard(valkey);
	}
}

// Concurrent identical misses share one `produce` per pod; a 413 Response is shared, never cached.
export async function cachedPublicExport(
	dataset: PublicExportDataset,
	format: string,
	input: PublicSearchInput,
	produce: () => Promise<string | Response>,
): Promise<string | Response> {
	const key = publicExportCacheKey(dataset, format, input);
	const cached = await readCachedExport(key);
	if (cached !== null) return cached;

	let running = inflight.get(key);
	if (!running) {
		const unfiltered = exportFilters(input).every((value) => value === null);
		running = (async () => {
			const result = await produce();
			if (typeof result === "string") {
				await storeCachedExport(key, result, unfiltered);
			}
			return result;
		})().finally(() => {
			inflight.delete(key);
		});
		inflight.set(key, running);
	}
	const result = await running;
	return result instanceof Response ? result.clone() : result;
}
