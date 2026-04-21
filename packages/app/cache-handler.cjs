// @ts-check
/**
 * Custom Next.js cache handler backed by Valkey.
 *
 * Implements the legacy cacheHandler interface (get, set, revalidateTag, resetRequestCache).
 * Used for ISR pages, fetch cache, route handlers, and image optimization.
 *
 * Graceful degradation: if VALKEY_URL is not set or the connection fails,
 * all methods silently return null / no-op. The app works exactly as without this handler.
 */

const { PHASE_PRODUCTION_BUILD } = require("next/constants");

// Lazy-load `redis` only when a client is actually needed. This keeps bundlers
// (Turbopack) from tracing the package — and its `node:crypto` dependency —
// into edge chunks that might transitively reference this handler.
/** @type {typeof import("redis").createClient | undefined} */
let createClientFn;
/**
 * @returns {typeof import("redis").createClient}
 */
function loadCreateClient() {
	if (createClientFn) return createClientFn;
	// Use an indirect require so the specifier is not a static literal at parse
	// time; Turbopack's static analysis leaves dynamic requires alone.
	const dynamicRequire = require;
	createClientFn = dynamicRequire("redis").createClient;
	return /** @type {typeof import("redis").createClient} */ (createClientFn);
}

const KEY_PREFIX = "nextcache:";
const TAG_PREFIX = "nexttag:";
const DEFAULT_TTL_SECONDS = 86_400; // 24 hours
const TAG_TTL_SECONDS = 7 * 86_400; // 7 days — bounds tag key growth

// ---------- Connection management ----------

/** @type {import("redis").RedisClientType | null} */
let client = null;

/** @type {Promise<import("redis").RedisClientType | null> | null} */
let connectionPromise = null;

/**
 * Reset the singleton so the next `getClient()` call attempts a fresh connection.
 * Called on error / disconnect so a transient Valkey outage does not wedge the
 * handler with a stale disconnected client.
 */
function resetClient() {
	client = null;
	connectionPromise = null;
}

/**
 * Returns a connected Valkey client, or null if unavailable.
 * Lazy singleton — connects on first call, reuses thereafter.
 */
async function getClient() {
	if (!process.env.VALKEY_URL) return null;
	if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return null;

	if (client?.isReady) return client;

	// Client exists but is no longer ready (errored / disconnected).
	// Clear the singleton so we can reconnect below.
	if (client && !client.isReady) resetClient();

	if (connectionPromise) return connectionPromise;

	connectionPromise = (async () => {
		try {
			const createClient = loadCreateClient();
			const c = createClient({
				url: process.env.VALKEY_URL,
				socket: {
					reconnectStrategy: (retries) => Math.min(retries * 100, 10_000),
				},
			});

			c.on("error", (err) => {
				console.error("[cache-handler] Valkey client error:", err.message);
			});

			c.on("end", () => {
				console.warn(
					"[cache-handler] Valkey connection ended, will reconnect on next use",
				);
				resetClient();
			});

			await c.connect();
			console.info("[cache-handler] Connected to Valkey");
			client = /** @type {import("redis").RedisClientType} */ (c);
			return client;
		} catch (err) {
			console.warn(
				"[cache-handler] Failed to connect to Valkey:",
				/** @type {Error} */ (err).message,
			);
			resetClient();
			return null;
		}
	})();

	return connectionPromise;
}

// ---------- Serialization helpers ----------
// Next.js cache entries may contain Buffers (IMAGE.buffer, APP_PAGE.rscData, APP_ROUTE.body).
// We convert them to base64 for JSON storage and restore on read.

/**
 * @param {Record<string, unknown> | null} data
 * @returns {Record<string, unknown> | null}
 */
function serializeValue(data) {
	if (!data) return data;
	const clone = { ...data };

	/** @type {string[]} */
	const bufferFields = [];

	for (const field of ["buffer", "rscData", "body"]) {
		if (Buffer.isBuffer(clone[field])) {
			clone[field] = /** @type {Buffer} */ (clone[field]).toString("base64");
			bufferFields.push(field);
		}
	}

	if (bufferFields.length > 0) {
		clone.__bufferFields = bufferFields;
	}

	return clone;
}

/**
 * @param {Record<string, unknown> | null} data
 * @returns {Record<string, unknown> | null}
 */
function deserializeValue(data) {
	if (!data) return data;
	const bufferFields = /** @type {string[] | undefined} */ (
		data.__bufferFields
	);
	if (!bufferFields) return data;

	const clone = { ...data };
	for (const field of bufferFields) {
		if (typeof clone[field] === "string") {
			clone[field] = Buffer.from(
				/** @type {string} */ (clone[field]),
				"base64",
			);
		}
	}
	delete clone.__bufferFields;
	return clone;
}

// ---------- Cache handler ----------

module.exports = class CacheHandler {
	/**
	 * @param {object} [options]
	 */
	constructor(options) {
		this.options = options;
	}

	/**
	 * Retrieve a cache entry.
	 * @param {string} key
	 * @returns {Promise<{value: unknown, lastModified: number, tags: string[]} | null>}
	 */
	async get(key) {
		const redis = await getClient();
		if (!redis) return null;

		try {
			const raw = await redis.get(KEY_PREFIX + key);
			if (!raw) return null;

			const entry = JSON.parse(raw);

			// Tag invalidation check: `entry.lastModified` is the wall-clock time the
			// entry was written (see `set` below), and each tag key stores the
			// wall-clock time of the most recent `revalidateTag` call. An entry is
			// stale iff any of its tags was revalidated strictly after the write.
			// Note: we rely on `Date.now()` across processes, so clock skew between
			// instances could keep an entry alive for up to ~1s beyond a revalidation.
			// That matches Next.js' own filesystem handler semantics.
			if (entry.tags?.length > 0) {
				const tagKeys = entry.tags.map(
					(/** @type {string} */ t) => TAG_PREFIX + t,
				);
				const timestamps = await redis.mGet(tagKeys);
				for (const ts of timestamps) {
					if (ts && Number(ts) > entry.lastModified) {
						return null;
					}
				}
			}

			return {
				value: deserializeValue(entry.value),
				lastModified: entry.lastModified,
				tags: entry.tags ?? [],
			};
		} catch (err) {
			console.error(
				"[cache-handler] get error:",
				/** @type {Error} */ (err).message,
			);
			return null;
		}
	}

	/**
	 * Store a cache entry.
	 * @param {string} key
	 * @param {Record<string, unknown> | null} data
	 * @param {{ tags?: string[], revalidate?: number | false }} ctx
	 * @returns {Promise<void>}
	 */
	async set(key, data, ctx) {
		const redis = await getClient();
		if (!redis) return;

		try {
			const entry = {
				value: serializeValue(data),
				lastModified: Date.now(),
				tags: ctx.tags ?? [],
			};

			// Next.js passes the page/route revalidate window via `ctx.revalidate`
			// (seconds, or `false` for no revalidation). Fall back to 24h when unset
			// so tag keys referencing this entry stay bounded even for `force-cache`.
			const ttl =
				typeof ctx.revalidate === "number" && ctx.revalidate > 0
					? ctx.revalidate
					: DEFAULT_TTL_SECONDS;

			await redis.set(KEY_PREFIX + key, JSON.stringify(entry), { EX: ttl });
		} catch (err) {
			console.error(
				"[cache-handler] set error:",
				/** @type {Error} */ (err).message,
			);
		}
	}

	/**
	 * Invalidate cache entries by tag(s).
	 * Stores the invalidation timestamp so that `get` can detect stale entries.
	 * @param {string | string[]} tags
	 * @returns {Promise<void>}
	 */
	async revalidateTag(tags) {
		const redis = await getClient();
		if (!redis) return;

		try {
			const tagList = [tags].flat();
			const now = String(Date.now());
			const pipeline = redis.multi();
			for (const tag of tagList) {
				pipeline.set(TAG_PREFIX + tag, now, { EX: TAG_TTL_SECONDS });
			}
			await pipeline.exec();
		} catch (err) {
			console.error(
				"[cache-handler] revalidateTag error:",
				/** @type {Error} */ (err).message,
			);
		}
	}

	/**
	 * Reset per-request in-memory cache. No-op for external storage.
	 */
	resetRequestCache() {}
};
