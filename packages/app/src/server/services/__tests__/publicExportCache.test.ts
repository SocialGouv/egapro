import { beforeEach, describe, expect, it, vi } from "vitest";
import { parsePublicSearchInput } from "~/modules/public-api";
import { createFakeValkey } from "~/test/fakeValkey";

const mocks = vi.hoisted(() => ({ exportCacheClient: vi.fn() }));

vi.mock("~/server/services/valkey", async () =>
	(await import("~/test/fakeValkey")).mockValkeyModule(mocks.exportCacheClient),
);

function inputOf(query: string) {
	const parsed = parsePublicSearchInput(new URLSearchParams(query));
	if (!parsed.success) throw new Error(`invalid query: ${query}`);
	return parsed.data;
}

async function discardSpy() {
	const { exportCacheValkey } = await import("~/server/services/valkey");
	return exportCacheValkey.discard;
}

function deferred<T>() {
	let resolve: (value: T) => void = () => undefined;
	const promise = new Promise<T>((settle) => {
		resolve = settle;
	});
	return { promise, resolve };
}

beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	mocks.exportCacheClient.mockResolvedValue(null);
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

describe("cachedPublicExport", () => {
	it("produces the body on every call without Valkey", async () => {
		const { cachedPublicExport } = await import("../publicExportCache");
		const produce = vi.fn(async () => "body");

		await cachedPublicExport("declarations", "csv", inputOf(""), produce);
		const second = await cachedPublicExport(
			"declarations",
			"csv",
			inputOf(""),
			produce,
		);

		expect(second).toBe("body");
		expect(produce).toHaveBeenCalledTimes(2);
	});

	it("serves an equivalent query from Valkey, compressed, with a one-hour expiry", async () => {
		const valkey = createFakeValkey();
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const { cachedPublicExport } = await import("../publicExportCache");
		const body = '"2027";"123456789";"Société Démo"\n'.repeat(1_000);
		const produce = vi.fn(async () => body);

		await cachedPublicExport(
			"declarations",
			"csv",
			inputOf("region=11&region=84"),
			produce,
		);
		const cached = await cachedPublicExport(
			"declarations",
			"csv",
			inputOf("region=84&limit=5&region=11"),
			produce,
		);

		expect(cached).toBe(body);
		expect(produce).toHaveBeenCalledTimes(1);
		expect(valkey.set).toHaveBeenCalledWith(
			expect.any(String),
			expect.any(String),
			{
				EX: 3_600,
			},
		);
		const [stored] = [...valkey.store.values()];
		expect(stored?.length).toBeLessThan(body.length / 10);
	});

	it("runs one computation for concurrent identical requests", async () => {
		const { cachedPublicExport } = await import("../publicExportCache");
		const gate = deferred<string>();
		const produce = vi.fn(() => gate.promise);

		const calls = [
			cachedPublicExport("declarations", "csv", inputOf("naf=C"), produce),
			cachedPublicExport(
				"declarations",
				"csv",
				inputOf("naf=C&page=2"),
				produce,
			),
			cachedPublicExport("declarations", "csv", inputOf("naf=C"), produce),
		];
		await vi.waitFor(() => expect(produce).toHaveBeenCalled());
		gate.resolve("body");

		expect(await Promise.all(calls)).toEqual(["body", "body", "body"]);
		expect(produce).toHaveBeenCalledTimes(1);
	});

	it("hands each concurrent caller its own readable copy of a 413", async () => {
		const { cachedPublicExport } = await import("../publicExportCache");
		const gate = deferred<Response>();
		const produce = vi.fn(() => gate.promise);

		const calls = [
			cachedPublicExport("declarations", "json", inputOf(""), produce),
			cachedPublicExport("declarations", "json", inputOf(""), produce),
		];
		await vi.waitFor(() => expect(produce).toHaveBeenCalled());
		gate.resolve(Response.json({ error: "trop" }, { status: 413 }));
		const responses = await Promise.all(calls);

		for (const response of responses) {
			if (!(response instanceof Response)) throw new Error("expected a 413");
			expect(response.status).toBe(413);
			expect(await response.json()).toEqual({ error: "trop" });
		}
		expect(produce).toHaveBeenCalledTimes(1);
	});

	it("computes again once the previous computation settled", async () => {
		const { cachedPublicExport } = await import("../publicExportCache");
		const produce = vi.fn(async () => "body");

		await cachedPublicExport("declarations", "csv", inputOf("naf=C"), produce);
		await cachedPublicExport("declarations", "csv", inputOf("naf=C"), produce);

		expect(produce).toHaveBeenCalledTimes(2);
	});

	it("never caches a 413", async () => {
		const valkey = createFakeValkey();
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const { cachedPublicExport } = await import("../publicExportCache");

		await cachedPublicExport("declarations", "csv", inputOf(""), async () =>
			Response.json({ error: "trop" }, { status: 413 }),
		);

		expect(valkey.set).not.toHaveBeenCalled();
	});

	it("stops caching filtered exports once the hourly budget is spent", async () => {
		const valkey = createFakeValkey();
		valkey.eval.mockResolvedValue(Number.MAX_SAFE_INTEGER);
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const { cachedPublicExport } = await import("../publicExportCache");

		await cachedPublicExport(
			"declarations",
			"csv",
			inputOf("region=11"),
			async () => "body",
		);

		expect(valkey.set).not.toHaveBeenCalled();
	});

	it("keeps caching the unfiltered export outside the budget", async () => {
		const valkey = createFakeValkey();
		valkey.eval.mockResolvedValue(Number.MAX_SAFE_INTEGER);
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const { cachedPublicExport } = await import("../publicExportCache");

		await cachedPublicExport(
			"declarations",
			"csv",
			inputOf("limit=5&utm_source=x"),
			async () => "body",
		);

		expect(valkey.eval).not.toHaveBeenCalled();
		expect(valkey.set).toHaveBeenCalledTimes(1);
	});

	it("skips a filtered entry above 16 MB compressed but keeps the unfiltered one", async () => {
		const valkey = createFakeValkey();
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const { cachedPublicExport } = await import("../publicExportCache");
		const { randomBytes } = await import("node:crypto");
		const incompressible = randomBytes(13 * 1024 * 1024).toString("base64");

		await cachedPublicExport(
			"declarations",
			"csv",
			inputOf("region=11"),
			async () => incompressible,
		);
		expect(valkey.set).not.toHaveBeenCalled();

		await cachedPublicExport(
			"declarations",
			"csv",
			inputOf(""),
			async () => incompressible,
		);
		expect(valkey.set).toHaveBeenCalledTimes(1);
	});

	it("fails open, logs and drops the cache client when Valkey errors", async () => {
		const valkey = createFakeValkey();
		valkey.get.mockRejectedValue(new Error("connection reset"));
		valkey.eval.mockRejectedValue(new Error("connection reset"));
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { cachedPublicExport } = await import("../publicExportCache");

		const result = await cachedPublicExport(
			"declarations",
			"csv",
			inputOf("region=11"),
			async () => "body",
		);

		expect(result).toBe("body");
		expect(await discardSpy()).toHaveBeenCalledWith(valkey);
		expect(consoleSpy).toHaveBeenCalledWith(
			"[publicExportCache] read",
			"connection reset",
		);
		expect(consoleSpy).toHaveBeenCalledWith(
			"[publicExportCache] write",
			"connection reset",
		);
		consoleSpy.mockRestore();
	});

	it("treats an undecodable entry as a miss without dropping the client", async () => {
		const valkey = createFakeValkey();
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { cachedPublicExport, publicExportCacheKey } = await import(
			"../publicExportCache"
		);
		valkey.store.set(
			publicExportCacheKey("declarations", "csv", inputOf("")),
			"not-a-gzip-payload",
		);

		const result = await cachedPublicExport(
			"declarations",
			"csv",
			inputOf(""),
			async () => "fresh",
		);

		expect(result).toBe("fresh");
		expect(await discardSpy()).not.toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalledWith(
			"[publicExportCache] decode",
			expect.any(String),
		);
		consoleSpy.mockRestore();
	});
});
