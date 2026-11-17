import { describe, expect, it } from "vitest";

import { toHealthCheckLine, writeHealthCheckLine } from "../stdout.js";

describe("health_check stdout line", () => {
	it("carries the keys Grafana reads, and nothing else", () => {
		const line = toHealthCheckLine({
			probeKey: "postgres-app",
			result: {
				status: "unavailable",
				latencyMs: 512,
				message: "password authentication failed for user postgres",
			},
			checkedAt: new Date("2026-11-17T10:42:00.000Z"),
		});

		expect(line).toEqual({
			logType: "health_check",
			probeKey: "postgres-app",
			status: "unavailable",
			latencyMs: 512,
			checkedAt: "2026-11-17T10:42:00.000Z",
		});
	});

	it("writes one JSON document per line", () => {
		const written: string[] = [];

		writeHealthCheckLine(
			toHealthCheckLine({
				probeKey: "s3",
				result: { status: "operational", latencyMs: 12 },
				checkedAt: new Date("2026-11-17T10:42:00.000Z"),
			}),
			(chunk) => {
				written.push(chunk);
			},
		);

		expect(written).toHaveLength(1);
		expect(written[0]?.endsWith("\n")).toBe(true);
		expect(JSON.parse(written[0] ?? "")).toMatchObject({
			logType: "health_check",
			probeKey: "s3",
			status: "operational",
		});
	});
});
