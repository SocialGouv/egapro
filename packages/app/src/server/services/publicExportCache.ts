import "server-only";

import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";
import type { PublicSearchInput } from "~/modules/public-api";
import { discardValkey, getValkey, withValkeyTimeout } from "./valkey";

const TTL_SECONDS = 3_600;
const COMMAND_TIMEOUT_MS = 5_000;
/**
 * Compressed bytes the export cache may write per hour. Entries live one hour,
 * so at most two budgets are resident at once: a caller cycling through filter
 * combinations can never grow the shared Valkey past that.
 */
const HOURLY_BYTE_BUDGET = 64 * 1024 * 1024;
const KEY_PREFIX = "public-export:v1";
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export type PublicExportDataset = "declarations" | "representations";

function normalizedFacet(values: readonly string[] | undefined) {
	return values ? [...new Set(values)].sort() : null;
}

/**
 * Only the parameters that change the exported rows enter the key, in a fixed
 * order with multi-valued facets sorted: pagination, sort and unknown
 * parameters cannot mint a new entry for the same data.
 */
export function publicExportCacheKey(
	dataset: PublicExportDataset,
	format: string,
	input: PublicSearchInput,
): string {
	const filters = [
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
	const digest = createHash("sha256")
		.update(JSON.stringify(filters))
		.digest("hex");
	return `${KEY_PREFIX}:${dataset}:${format}:${digest}`;
}

async function decompress(payload: string): Promise<string | null> {
	try {
		return (await gunzipAsync(Buffer.from(payload, "base64"))).toString("utf8");
	} catch {
		return null;
	}
}

export async function readCachedExport(key: string): Promise<string | null> {
	const valkey = await getValkey();
	if (!valkey) return null;
	let payload: string | null;
	try {
		payload = await withValkeyTimeout(valkey.get(key), COMMAND_TIMEOUT_MS);
	} catch {
		discardValkey(valkey);
		return null;
	}
	return payload === null ? null : decompress(payload);
}

export async function storeCachedExport(
	key: string,
	body: string,
): Promise<void> {
	const valkey = await getValkey();
	if (!valkey) return;
	const hour = Math.floor(Date.now() / (TTL_SECONDS * 1000));
	try {
		const payload = (await gzipAsync(body)).toString("base64");
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
		await withValkeyTimeout(
			valkey.set(key, payload, { EX: TTL_SECONDS }),
			COMMAND_TIMEOUT_MS,
		);
	} catch {
		discardValkey(valkey);
	}
}
