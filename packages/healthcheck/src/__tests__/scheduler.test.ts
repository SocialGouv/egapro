import { describe, expect, it } from "vitest";

import type { Probe, ProbeResult } from "../probes/types.js";
import { createScheduler } from "../scheduler.js";

const operational: ProbeResult = { status: "operational", latencyMs: 1 };

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(
	predicate: () => boolean,
	timeoutMs = 2000,
): Promise<void> {
	const startedAt = Date.now();
	while (!predicate()) {
		if (Date.now() - startedAt > timeoutMs) {
			throw new Error("waitFor timed out");
		}
		await delay(5);
	}
}

function makeProbe(
	key: string,
	probe: Probe["probe"],
	overrides: Partial<Pick<Probe, "intervalSeconds" | "timeoutMs">> = {},
): Probe {
	return {
		key,
		label: key,
		criticality: "critical",
		kind: "internal",
		intervalSeconds: 10,
		timeoutMs: 1000,
		probe,
		...overrides,
	};
}

const neverResolves = (): Promise<ProbeResult> =>
	new Promise<ProbeResult>(() => undefined);

describe("scheduler", () => {
	it("runs every probe as soon as it starts", async () => {
		const seen: string[] = [];
		const scheduler = createScheduler({
			probes: [
				makeProbe("alpha", async () => operational),
				makeProbe("beta", async () => operational),
			],
			onResult: (probe) => {
				seen.push(probe.key);
			},
		});

		scheduler.start();
		await waitFor(() => seen.length >= 2);
		await scheduler.stop();

		expect([...seen].sort()).toEqual(["alpha", "beta"]);
	});

	it("runs a probe again after its own interval", async () => {
		const seen: string[] = [];
		const scheduler = createScheduler({
			probes: [
				makeProbe("alpha", async () => operational, { intervalSeconds: 0.02 }),
			],
			onResult: (probe) => {
				seen.push(probe.key);
			},
		});

		scheduler.start();
		await waitFor(() => seen.length >= 3);
		await scheduler.stop();

		expect(seen.length).toBeGreaterThanOrEqual(3);
	});

	it("never runs the same probe twice at the same time", async () => {
		let active = 0;
		let maxActive = 0;
		let runs = 0;

		const scheduler = createScheduler({
			probes: [
				makeProbe(
					"alpha",
					async () => {
						active += 1;
						maxActive = Math.max(maxActive, active);
						runs += 1;
						await delay(20);
						active -= 1;
						return operational;
					},
					{ intervalSeconds: 0.001 },
				),
			],
			onResult: () => undefined,
		});

		scheduler.start();
		await waitFor(() => runs >= 3);
		await scheduler.stop();

		expect(maxActive).toBe(1);
	});

	it("keeps probing the others while one probe hangs", async () => {
		const seen: string[] = [];
		const scheduler = createScheduler({
			probes: [
				makeProbe("hung", neverResolves, { timeoutMs: 60_000 }),
				makeProbe("fast", async () => operational, { intervalSeconds: 0.005 }),
			],
			onResult: (probe) => {
				seen.push(probe.key);
			},
		});

		scheduler.start();
		await waitFor(() => seen.filter((key) => key === "fast").length >= 3);

		expect(seen).not.toContain("hung");

		await scheduler.stop();
	});

	it("reports a probe that exceeds its timeout as unavailable", async () => {
		const seen: ProbeResult[] = [];
		const scheduler = createScheduler({
			probes: [makeProbe("slow", neverResolves, { timeoutMs: 20 })],
			onResult: (_probe, result) => {
				seen.push(result);
			},
		});

		scheduler.start();
		await waitFor(() => seen.length >= 1);
		await scheduler.stop();

		expect(seen[0]?.status).toBe("unavailable");
		expect(seen[0]?.message).toBe("timeout after 20 ms");
	});

	it("keeps probing when a probe throws instead of returning", async () => {
		const seen: ProbeResult[] = [];
		const scheduler = createScheduler({
			probes: [
				makeProbe(
					"broken",
					async () => {
						throw new Error("boom");
					},
					{ intervalSeconds: 0.01 },
				),
			],
			onResult: (_probe, result) => {
				seen.push(result);
			},
		});

		scheduler.start();
		await waitFor(() => seen.length >= 2);
		await scheduler.stop();

		expect(seen[0]?.status).toBe("unavailable");
		expect(seen[0]?.message).toBe("boom");
	});

	it("keeps probing when a result cannot be stored", async () => {
		let results = 0;
		let errors = 0;
		const scheduler = createScheduler({
			probes: [
				makeProbe("alpha", async () => operational, { intervalSeconds: 0.01 }),
			],
			onResult: () => {
				results += 1;
				throw new Error("database is down");
			},
			onError: () => {
				errors += 1;
			},
		});

		scheduler.start();
		await waitFor(() => errors >= 1);
		await scheduler.stop();

		expect(results).toBeGreaterThanOrEqual(1);
	});

	it("stops scheduling once stopped", async () => {
		const seen: string[] = [];
		const scheduler = createScheduler({
			probes: [
				makeProbe("alpha", async () => operational, { intervalSeconds: 0.01 }),
			],
			onResult: (probe) => {
				seen.push(probe.key);
			},
		});

		scheduler.start();
		await waitFor(() => seen.length >= 1);
		await scheduler.stop();
		const frozen = seen.length;

		await delay(80);

		expect(seen.length).toBe(frozen);
	});
});
