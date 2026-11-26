import { describe, expect, it, vi } from "vitest";

import { createNotificationQueue } from "../delivery.js";
import type { ProbeNotification } from "../policy.js";

const NOW = new Date("2026-11-19T10:00:00.000Z");
const OUTAGE_START = new Date("2026-11-19T09:55:00.000Z");

function notification(
	kind: ProbeNotification["kind"],
	overrides: Partial<ProbeNotification> = {},
): ProbeNotification {
	return {
		kind,
		probe: {
			key: "clamav",
			label: "ClamAV",
			criticality: "critical",
			kind: "internal",
		},
		status: kind === "recovery" ? "operational" : "unavailable",
		statusSince: OUTAGE_START,
		checkedAt: NOW,
		consecutiveFailures: kind === "recovery" ? 0 : 3,
		latencyMs: 4,
		message: "connection refused",
		nextExpectedAt: null,
		...overrides,
	};
}

describe("createNotificationQueue", () => {
	it("does not retry a delivered notification", async () => {
		const notify = vi.fn().mockResolvedValue(true);
		const queue = createNotificationQueue({ notify });

		await queue.enqueue(notification("alert"));
		await queue.enqueue(notification("recovery"));

		expect(notify).toHaveBeenCalledTimes(2);
	});

	it("retries an undelivered alert on the next run, then the recovery in order", async () => {
		const notify = vi
			.fn()
			.mockResolvedValueOnce(false)
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce(true);
		const queue = createNotificationQueue({ notify });

		await queue.enqueue(notification("alert"));
		expect(notify).toHaveBeenCalledTimes(1);

		// The next run of the same probe emits the recovery: the failed alert is
		// flushed first, so the recovery never arrives without its alert.
		await queue.enqueue(notification("recovery"));

		expect(notify).toHaveBeenCalledTimes(3);
		expect(notify.mock.calls.map(([sent]) => sent.kind)).toEqual([
			"alert",
			"alert",
			"recovery",
		]);
	});

	it("keeps the queue per probe: another probe is not blocked by a failed delivery", async () => {
		const notify = vi
			.fn()
			.mockResolvedValueOnce(false)
			.mockResolvedValueOnce(true);
		const queue = createNotificationQueue({ notify });

		await queue.enqueue(notification("alert"));
		await queue.enqueue(
			notification("alert", {
				probe: {
					key: "postgres-app",
					label: "PostgreSQL",
					criticality: "critical",
					kind: "internal",
				},
			}),
		);

		expect(notify.mock.calls.map(([sent]) => sent.probe.key)).toEqual([
			"clamav",
			"postgres-app",
		]);
	});
});
