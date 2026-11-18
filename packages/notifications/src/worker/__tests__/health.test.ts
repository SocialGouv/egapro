import type { Sql } from "postgres";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createQueueDbCheck,
	type HealthServer,
	resolveHealthPort,
	startHealthServer,
} from "../health.js";

function fakeSql(run: () => Promise<unknown>): Sql {
	return (() => run()) as unknown as Sql;
}

describe("resolveHealthPort", () => {
	it("is opt-in: no variable means no listener", () => {
		expect(resolveHealthPort(undefined)).toBeNull();
		expect(resolveHealthPort("")).toBeNull();
	});

	it("reads a valid port", () => {
		expect(resolveHealthPort("3000")).toBe(3000);
	});

	it("refuses a value that is not a usable port", () => {
		expect(resolveHealthPort("0")).toBeNull();
		expect(resolveHealthPort("-1")).toBeNull();
		expect(resolveHealthPort("65536")).toBeNull();
		expect(resolveHealthPort("http")).toBeNull();
	});
});

describe("createQueueDbCheck", () => {
	it("is ready when the queue database answers", async () => {
		const check = createQueueDbCheck(fakeSql(async () => [{ ok: 1 }]));

		await expect(check()).resolves.toBe(true);
	});

	it("is not ready when the queue database fails", async () => {
		const check = createQueueDbCheck(
			fakeSql(async () => {
				throw new Error("connect ECONNREFUSED 10.0.0.4:5432");
			}),
		);

		await expect(check()).resolves.toBe(false);
	});

	it("is not ready when the query outlives the deadline", async () => {
		vi.useFakeTimers();
		const check = createQueueDbCheck(
			fakeSql(() => new Promise(() => undefined)),
			2000,
		);

		const pending = check();
		await vi.advanceTimersByTimeAsync(2000);

		await expect(pending).resolves.toBe(false);
		vi.useRealTimers();
	});
});

describe("startHealthServer", () => {
	let server: HealthServer | null = null;

	afterEach(async () => {
		await server?.close();
		server = null;
	});

	async function start(checkQueueDb: () => Promise<boolean>) {
		server = await startHealthServer({ port: 0, checkQueueDb });
		return `http://127.0.0.1:${server.port}`;
	}

	it("listens on an ephemeral port when asked for port 0", async () => {
		const url = await start(async () => true);

		expect(server?.port).toBeGreaterThan(0);
		expect(url).toContain("http://127.0.0.1:");
	});

	it("answers liveness without touching the queue database", async () => {
		const checkQueueDb = vi.fn(async () => true);
		const url = await start(checkQueueDb);

		const response = await fetch(`${url}/healthz`);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("OK");
		expect(checkQueueDb).not.toHaveBeenCalled();
	});

	it("answers readiness 200 when the queue database is reachable", async () => {
		const url = await start(async () => true);

		const response = await fetch(`${url}/readyz`);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("OK");
	});

	it("answers readiness 503 when the queue database is unreachable", async () => {
		const url = await start(async () => false);

		const response = await fetch(`${url}/readyz`);

		expect(response.status).toBe(503);
		expect(await response.text()).toBe("unavailable");
	});

	it("ignores a query string on the health paths", async () => {
		const url = await start(async () => true);

		const response = await fetch(`${url}/readyz?verbose=1`);

		expect(response.status).toBe(200);
	});

	it("rejects anything that is not a GET", async () => {
		const url = await start(async () => true);

		const response = await fetch(`${url}/healthz`, { method: "POST" });

		expect(response.status).toBe(405);
	});

	it("answers 404 on an unknown path", async () => {
		const url = await start(async () => true);

		const response = await fetch(`${url}/metrics`);

		expect(response.status).toBe(404);
	});

	it("answers 500 instead of crashing when the readiness check throws", async () => {
		const url = await start(async () => {
			throw new Error("unexpected driver crash");
		});

		const response = await fetch(`${url}/readyz`);

		expect(response.status).toBe(500);
	});

	it("stops listening once closed", async () => {
		const url = await start(async () => true);
		await server?.close();
		server = null;

		await expect(fetch(`${url}/healthz`)).rejects.toThrow();
	});
});
