import { beforeEach, describe, expect, it, vi } from "vitest";
import { parsePublicSearchInput } from "~/modules/public-api";
import { createFakeValkey } from "~/test/fakeValkey";

const mocks = vi.hoisted(() => ({
	getValkey: vi.fn(),
	discardValkey: vi.fn(),
}));

vi.mock("~/server/services/valkey", () => ({
	getValkey: mocks.getValkey,
	discardValkey: mocks.discardValkey,
	withValkeyTimeout: <T>(promise: Promise<T>) => promise,
}));

function inputOf(query: string) {
	const parsed = parsePublicSearchInput(new URLSearchParams(query));
	if (!parsed.success) throw new Error(`invalid query: ${query}`);
	return parsed.data;
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getValkey.mockResolvedValue(null);
});

describe("publicExportCacheKey", () => {
	it("gives the same key to equivalent query strings", async () => {
		const { publicExportCacheKey } = await import("../publicExportCache");

		const ordered = publicExportCacheKey(
			"declarations",
			"csv",
			inputOf("q=Démo&region=11&region=84&naf=C&year=2027"),
		);
		const shuffled = publicExportCacheKey(
			"declarations",
			"csv",
			inputOf(
				"year=2027&naf=C&region=84&utm_source=x&region=11&q=Démo&region=11&limit=50&offset=20&sort=name",
			),
		);

		expect(shuffled).toBe(ordered);
	});

	it("separates different filters, formats and datasets", async () => {
		const { publicExportCacheKey } = await import("../publicExportCache");
		const base = inputOf("region=11");

		const keys = new Set([
			publicExportCacheKey("declarations", "csv", base),
			publicExportCacheKey("declarations", "json", base),
			publicExportCacheKey("representations", "csv", base),
			publicExportCacheKey("declarations", "csv", inputOf("region=84")),
			publicExportCacheKey(
				"declarations",
				"csv",
				inputOf("region=11&year=2027"),
			),
			publicExportCacheKey("declarations", "csv", inputOf("")),
			publicExportCacheKey("declarations", "csv", inputOf("departement=11")),
			publicExportCacheKey("declarations", "csv", inputOf("workforceMin=50")),
			publicExportCacheKey("declarations", "csv", inputOf("workforceMax=50")),
		]);

		expect(keys.size).toBe(9);
	});

	it("never embeds the raw search text in the key", async () => {
		const { publicExportCacheKey } = await import("../publicExportCache");

		const key = publicExportCacheKey(
			"declarations",
			"csv",
			inputOf("q=Société Démo"),
		);

		expect(key).not.toContain("Démo");
	});
});

describe("readCachedExport / storeCachedExport", () => {
	it("is a no-op without Valkey", async () => {
		const { readCachedExport, storeCachedExport } = await import(
			"../publicExportCache"
		);

		await storeCachedExport("key", "body");

		expect(await readCachedExport("key")).toBeNull();
	});

	it("serves back what was stored, with a one-hour expiry", async () => {
		const valkey = createFakeValkey();
		mocks.getValkey.mockResolvedValue(valkey);
		const { readCachedExport, storeCachedExport } = await import(
			"../publicExportCache"
		);
		const body = '"year";"siren"\n"2027";"123456789"';

		await storeCachedExport("public-export:key", body);

		expect(valkey.set).toHaveBeenCalledWith(
			"public-export:key",
			expect.any(String),
			{ EX: 3_600 },
		);
		expect(await readCachedExport("public-export:key")).toBe(body);
	});

	it("stores the body compressed", async () => {
		const valkey = createFakeValkey();
		mocks.getValkey.mockResolvedValue(valkey);
		const { storeCachedExport } = await import("../publicExportCache");
		const body = '"2027";"123456789";"Société Démo"\n'.repeat(1_000);

		await storeCachedExport("public-export:key", body);

		const stored = valkey.store.get("public-export:key") ?? "";
		expect(stored.length).toBeGreaterThan(0);
		expect(stored.length).toBeLessThan(body.length / 10);
	});

	it("stops caching once the hourly byte budget is spent", async () => {
		const valkey = createFakeValkey();
		valkey.eval.mockResolvedValue(Number.MAX_SAFE_INTEGER);
		mocks.getValkey.mockResolvedValue(valkey);
		const { storeCachedExport } = await import("../publicExportCache");

		await storeCachedExport("public-export:key", "body");

		expect(valkey.set).not.toHaveBeenCalled();
	});

	it("fails open and drops the client when Valkey errors", async () => {
		const valkey = createFakeValkey();
		valkey.get.mockRejectedValue(new Error("connection reset"));
		valkey.eval.mockRejectedValue(new Error("connection reset"));
		mocks.getValkey.mockResolvedValue(valkey);
		const { readCachedExport, storeCachedExport } = await import(
			"../publicExportCache"
		);

		await expect(storeCachedExport("key", "body")).resolves.toBeUndefined();
		expect(await readCachedExport("key")).toBeNull();
		expect(mocks.discardValkey).toHaveBeenCalledWith(valkey);
	});

	it("treats an undecodable entry as a miss", async () => {
		const valkey = createFakeValkey();
		valkey.store.set("key", "not-a-gzip-payload");
		mocks.getValkey.mockResolvedValue(valkey);
		const { readCachedExport } = await import("../publicExportCache");

		expect(await readCachedExport("key")).toBeNull();
	});
});
