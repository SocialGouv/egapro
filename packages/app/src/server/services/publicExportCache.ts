import "server-only";

import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";
import {
	MAX_CONCURRENT_PUBLIC_EXPORTS,
	type PublicSearchInput,
	publicExportBusyResponse,
} from "~/modules/public-api";
import { exportCacheValkey, withValkeyTimeout } from "./valkey";

const TTL_SECONDS = 3_600;
const COMMAND_TIMEOUT_MS = 5_000;
const NON_FILTER_FIELDS = new Set(["limit", "offset", "sort"]);
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const inflight = new Map<UnfilteredPublicExport, Promise<string | Response>>();
let runningExports = 0;

type UnfilteredPublicExport =
	| "declarations:csv"
	| "declarations:json"
	| "representations:csv";

// Every other field narrows the rows, so a filter added to the schema later is never served from the full-export key.
function isUnfiltered(input: PublicSearchInput): boolean {
	return Object.entries(input).every(
		([field, value]) => NON_FILTER_FIELDS.has(field) || value === undefined,
	);
}

function cacheKey(name: UnfilteredPublicExport): string {
	return `public-export:v2:${name}`;
}

function logCacheFailure(operation: string, error: unknown) {
	console.error(
		`[publicExportCache] ${operation}`,
		error instanceof Error ? error.message : "unknown error",
	);
}

async function readCachedExport(
	name: UnfilteredPublicExport,
): Promise<string | null> {
	const valkey = await exportCacheValkey.client();
	if (!valkey) return null;
	let payload: string | null;
	try {
		payload = await withValkeyTimeout(
			valkey.get(cacheKey(name)),
			COMMAND_TIMEOUT_MS,
		);
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
	name: UnfilteredPublicExport,
	body: string,
): Promise<void> {
	const valkey = await exportCacheValkey.client();
	if (!valkey) return;
	try {
		const payload = (await gzipAsync(body)).toString("base64");
		await withValkeyTimeout(
			valkey.set(cacheKey(name), payload, { EX: TTL_SECONDS }),
			COMMAND_TIMEOUT_MS,
		);
	} catch (error) {
		logCacheFailure("write", error);
		exportCacheValkey.discard(valkey);
	}
}

async function cachedUnfilteredExport(
	name: UnfilteredPublicExport,
	produce: () => Promise<string | Response>,
): Promise<string | Response> {
	const cached = await readCachedExport(name);
	if (cached !== null) return cached;

	let running = inflight.get(name);
	if (!running) {
		running = withPublicExportSlot(async () => {
			const produced = await produce();
			if (typeof produced === "string") {
				await storeCachedExport(name, produced);
			}
			return produced;
		}).finally(() => {
			inflight.delete(name);
		});
		inflight.set(name, running);
	}
	const shared = await running;
	return shared instanceof Response ? shared.clone() : shared;
}

export async function withPublicExportSlot<T>(
	produce: () => Promise<T | Response>,
): Promise<T | Response> {
	if (runningExports >= MAX_CONCURRENT_PUBLIC_EXPORTS) {
		return publicExportBusyResponse();
	}
	runningExports += 1;
	try {
		return await produce();
	} finally {
		runningExports -= 1;
	}
}

export function servePublicExport(
	name: UnfilteredPublicExport,
	input: PublicSearchInput,
	produce: () => Promise<string | Response>,
): Promise<string | Response> {
	return isUnfiltered(input)
		? cachedUnfilteredExport(name, produce)
		: withPublicExportSlot(produce);
}
