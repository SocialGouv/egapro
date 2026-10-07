import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	MAX_CONCURRENT_PUBLIC_EXPORTS,
	parsePublicSearchInput,
} from "~/modules/public-api";
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

describe("servePublicExport — unfiltered exports", () => {
	it("caches the unfiltered export under one constant key, compressed, for one hour", async () => {
		const valkey = createFakeValkey();
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const { servePublicExport } = await import("../publicExportCache");
		const body = '"2027";"123456789";"Société Démo"\n'.repeat(1_000);
		const produce = vi.fn(async () => body);

		await servePublicExport("declarations:csv", inputOf(""), produce);
		const cached = await servePublicExport(
			"declarations:csv",
			inputOf("limit=5&offset=20&sort=name&utm_source=x"),
			produce,
		);

		expect(cached).toBe(body);
		expect(produce).toHaveBeenCalledTimes(1);
		expect([...valkey.store.keys()]).toEqual([
			"public-export:v2:declarations:csv",
		]);
		expect(valkey.set).toHaveBeenCalledWith(
			"public-export:v2:declarations:csv",
			expect.any(String),
			{ EX: 3_600 },
		);
		const [stored] = [...valkey.store.values()];
		expect(stored?.length).toBeLessThan(body.length / 10);
	});

	it("keeps the three unfiltered exports apart", async () => {
		const valkey = createFakeValkey();
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const { servePublicExport } = await import("../publicExportCache");

		await servePublicExport("declarations:csv", inputOf(""), async () => "a");
		await servePublicExport("declarations:json", inputOf(""), async () => "b");
		await servePublicExport(
			"representations:csv",
			inputOf(""),
			async () => "c",
		);

		expect([...valkey.store.keys()].sort((a, b) => a.localeCompare(b))).toEqual(
			[
				"public-export:v2:declarations:csv",
				"public-export:v2:declarations:json",
				"public-export:v2:representations:csv",
			],
		);
	});

	it("produces the body on every call without Valkey", async () => {
		const { servePublicExport } = await import("../publicExportCache");
		const produce = vi.fn(async () => "body");

		await servePublicExport("declarations:csv", inputOf(""), produce);
		const second = await servePublicExport(
			"declarations:csv",
			inputOf(""),
			produce,
		);

		expect(second).toBe("body");
		expect(produce).toHaveBeenCalledTimes(2);
	});

	it("runs one computation for concurrent unfiltered requests", async () => {
		const { servePublicExport } = await import("../publicExportCache");
		const gate = deferred<string>();
		const produce = vi.fn(() => gate.promise);

		const calls = [
			servePublicExport("declarations:csv", inputOf(""), produce),
			servePublicExport("declarations:csv", inputOf("limit=5"), produce),
			servePublicExport("declarations:csv", inputOf(""), produce),
		];
		await vi.waitFor(() => expect(produce).toHaveBeenCalled());
		gate.resolve("body");

		expect(await Promise.all(calls)).toEqual(["body", "body", "body"]);
		expect(produce).toHaveBeenCalledTimes(1);
	});

	it("hands each concurrent caller its own readable copy of a 413", async () => {
		const { servePublicExport } = await import("../publicExportCache");
		const gate = deferred<Response>();
		const produce = vi.fn(() => gate.promise);

		const calls = [
			servePublicExport("declarations:json", inputOf(""), produce),
			servePublicExport("declarations:json", inputOf(""), produce),
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

	it("never caches a 413", async () => {
		const valkey = createFakeValkey();
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const { servePublicExport } = await import("../publicExportCache");

		await servePublicExport("declarations:csv", inputOf(""), async () =>
			Response.json({ error: "trop" }, { status: 413 }),
		);

		expect(valkey.set).not.toHaveBeenCalled();
	});

	it("fails open, logs and drops the cache client when Valkey errors", async () => {
		const valkey = createFakeValkey();
		valkey.get.mockRejectedValue(new Error("connection reset"));
		valkey.set.mockRejectedValue(new Error("connection reset"));
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const { servePublicExport } = await import("../publicExportCache");

		const result = await servePublicExport(
			"declarations:csv",
			inputOf(""),
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
		const { servePublicExport } = await import("../publicExportCache");
		valkey.store.set("public-export:v2:declarations:csv", "not-a-gzip-payload");

		const result = await servePublicExport(
			"declarations:csv",
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

describe("servePublicExport — filtered exports", () => {
	it.each([
		"q=Démo",
		"city=Paris",
		"region=11",
		"departement=75",
		"naf=C",
		"workforceRanges=1000%2B",
		"workforceMin=50",
		"workforceMax=50",
		"year=2027",
	])("never reads nor writes the cache for %s", async (query) => {
		const valkey = createFakeValkey();
		mocks.exportCacheClient.mockResolvedValue(valkey);
		const { servePublicExport } = await import("../publicExportCache");
		const produce = vi.fn(async () => "filtered");

		await servePublicExport("declarations:csv", inputOf(query), produce);
		const second = await servePublicExport(
			"declarations:csv",
			inputOf(query),
			produce,
		);

		expect(second).toBe("filtered");
		expect(produce).toHaveBeenCalledTimes(2);
		expect(valkey.get).not.toHaveBeenCalled();
		expect(valkey.set).not.toHaveBeenCalled();
	});
});

describe("withPublicExportSlot", () => {
	it("answers 503 to the third concurrent computation", async () => {
		const { withPublicExportSlot } = await import("../publicExportCache");
		const gate = deferred<string>();

		const running = [
			withPublicExportSlot(() => gate.promise),
			withPublicExportSlot(() => gate.promise),
		];
		const third = await withPublicExportSlot(async () => "never");
		gate.resolve("done");

		if (!(third instanceof Response)) throw new Error("expected a 503");
		expect(third.status).toBe(503);
		expect(third.headers.get("Retry-After")).not.toBeNull();
		expect(await Promise.all(running)).toEqual(["done", "done"]);
	});

	it("frees its slot once a computation settles", async () => {
		const { withPublicExportSlot } = await import("../publicExportCache");

		for (let index = 0; index <= MAX_CONCURRENT_PUBLIC_EXPORTS; index += 1) {
			expect(await withPublicExportSlot(async () => "body")).toBe("body");
		}
	});

	it("frees its slot when a computation throws", async () => {
		const { withPublicExportSlot } = await import("../publicExportCache");

		for (let index = 0; index < MAX_CONCURRENT_PUBLIC_EXPORTS; index += 1) {
			await expect(
				withPublicExportSlot(async () => {
					throw new Error("db down");
				}),
			).rejects.toThrow("db down");
		}

		expect(await withPublicExportSlot(async () => "body")).toBe("body");
	});
});
