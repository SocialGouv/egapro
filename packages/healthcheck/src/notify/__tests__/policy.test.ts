import { describe, expect, it } from "vitest";
import { decideNotification, type NotificationInput } from "../policy.js";
import type { ProbeStatus } from "../probes/types.js";

const NOW = new Date("2026-11-19T10:00:00.000Z");
const OUTAGE_START = new Date("2026-11-19T09:55:00.000Z");

const probe = {
	key: "clamav",
	label: "ClamAV",
	criticality: "critical" as const,
	kind: "internal" as const,
};

function input(overrides: Partial<NotificationInput> = {}): NotificationInput {
	return {
		probe,
		status: "operational",
		consecutiveFailures: 0,
		latencyMs: 4,
		checkedAt: NOW,
		statusSince: NOW,
		previous: { status: "operational", consecutiveFailures: 0 },
		alertAfterFailures: 3,
		...overrides,
	};
}

function failing(
	status: ProbeStatus,
	consecutiveFailures: number,
	previousFailures = consecutiveFailures - 1,
): NotificationInput {
	return input({
		status,
		consecutiveFailures,
		message: "connection refused",
		statusSince: OUTAGE_START,
		previous: {
			status: consecutiveFailures === 1 ? "operational" : status,
			consecutiveFailures: Math.max(0, previousFailures),
		},
	});
}

describe("decideNotification", () => {
	it("stays silent on the first observation of a probe", () => {
		expect(
			decideNotification({
				...failing("unavailable", 1),
				previous: null,
			}),
		).toBeNull();
	});

	it("waits for the configured number of consecutive failures", () => {
		expect(decideNotification(failing("unavailable", 1))).toBeNull();
		expect(decideNotification(failing("unavailable", 2))).toBeNull();
	});

	it("sends one alert on the threshold run, then nothing while it stays down", () => {
		const alert = decideNotification(failing("unavailable", 3));

		expect(alert).toMatchObject({
			kind: "alert",
			status: "unavailable",
			consecutiveFailures: 3,
			probe: { key: "clamav", label: "ClamAV", criticality: "critical" },
		});
		expect(decideNotification(failing("unavailable", 4))).toBeNull();
		expect(decideNotification(failing("unavailable", 5))).toBeNull();
	});

	it("alerts for important probes too", () => {
		const alert = decideNotification({
			...failing("unavailable", 3),
			probe: { ...probe, criticality: "important" },
		});

		expect(alert?.kind).toBe("alert");
	});

	it("never notifies for a low-criticality probe", () => {
		const low = { ...probe, criticality: "low" as const };

		expect(
			decideNotification({ ...failing("unavailable", 3), probe: low }),
		).toBeNull();
		expect(
			decideNotification({
				...input({
					status: "operational",
					previous: { status: "unavailable", consecutiveFailures: 5 },
				}),
				probe: low,
			}),
		).toBeNull();
	});

	it("alerts immediately on a misconfiguration, once", () => {
		const alert = decideNotification(failing("misconfigured", 1));

		expect(alert).toMatchObject({ kind: "alert", status: "misconfigured" });
		expect(decideNotification(failing("misconfigured", 2))).toBeNull();
	});

	it("recovers once after an alert, with the outage start", () => {
		const recovery = decideNotification(
			input({
				status: "operational",
				previous: { status: "unavailable", consecutiveFailures: 7 },
				statusSince: OUTAGE_START,
			}),
		);

		expect(recovery).toMatchObject({
			kind: "recovery",
			status: "operational",
			statusSince: OUTAGE_START,
		});
	});

	it("recovers after an immediate misconfiguration alert", () => {
		expect(
			decideNotification(
				input({
					status: "operational",
					previous: { status: "misconfigured", consecutiveFailures: 1 },
					statusSince: OUTAGE_START,
				}),
			)?.kind,
		).toBe("recovery");
	});

	it("stays silent when a probe recovers before the alert threshold", () => {
		// Two failures, then a success: no alert was sent, so no recovery either.
		expect(
			decideNotification(
				input({
					status: "operational",
					previous: { status: "unavailable", consecutiveFailures: 2 },
				}),
			),
		).toBeNull();
	});

	it("keeps its memory across a worker restart", () => {
		// The counter is persisted: a restarted worker must neither re-alert
		// nor forget that an alert had been sent.
		expect(
			decideNotification(
				input({
					status: "unavailable",
					consecutiveFailures: 4,
					previous: { status: "unavailable", consecutiveFailures: 4 },
					statusSince: OUTAGE_START,
				}),
			),
		).toBeNull();
		expect(
			decideNotification(
				input({
					status: "operational",
					previous: { status: "unavailable", consecutiveFailures: 4 },
					statusSince: OUTAGE_START,
				}),
			)?.kind,
		).toBe("recovery");
	});

	it("alerts when a persistent degradation reaches the threshold", () => {
		const alert = decideNotification(failing("degraded", 3));

		expect(alert).toMatchObject({ kind: "alert", status: "degraded" });
	});
});
