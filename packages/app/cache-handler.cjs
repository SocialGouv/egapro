// @ts-check
/**
 * Custom Next.js cache handler backed by Valkey (Redis-compatible).
 *
 * Implements the legacy cacheHandler interface (get, set, revalidateTag, resetRequestCache).
 * Used for ISR pages, fetch cache, route handlers, and image optimization.
 *
 * Graceful degradation: if VALKEY_URL is not set or the connection fails,
 * all methods silently return null / no-op. The app works exactly as without this handler.
 */

const { createClient } = require("redis");
const { PHASE_PRODUCTION_BUILD } = require("next/constants");

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
 * Returns a connected Valkey client, or null if unavailable.
 * Lazy singleton — connects on first call, reuses thereafter.
 */
async function getClient() {
	if (!process.env.VALKEY_URL) return null;
	if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return null;

	if (client?.isReady) return client;

	if (connectionPromise) return connectionPromise;

	connectionPromise = (async () => {
		try {
			const c = createClient({
				url: process.env.VALKEY_URL,
				socket: {
					reconnectStrategy: (retries) => Math.min(retries * 100, 10_000),
				},
			});

			c.on("error", (err) => {
				console.error("[cache-handler] Valkey client error:", err.message);
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
			client = null;
			connectionPromise = null;
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

			// Check tag invalidation: if any tag was revalidated after the entry
			// was stored, treat it as a cache miss.
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
	 * @param {{ tags?: string[] }} ctx
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

			// Use the entry's revalidate time as TTL.
			// Falls back to 24h if not specified (e.g. force-cache without revalidate).
			const revalidate = /** @type {number | undefined} */ (data?.revalidate);
			const ttl =
				typeof revalidate === "number" && revalidate > 0
					? revalidate
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
