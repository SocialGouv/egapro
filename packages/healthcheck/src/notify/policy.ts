import type { Probe, ProbeKind, ProbeStatus } from "../probes/types.js";

export type NotificationKind = "alert" | "recovery";

export type ProbeNotification = {
	kind: NotificationKind;
	probe: {
		key: string;
		label: string;
		criticality: Probe["criticality"];
		kind: ProbeKind;
	};
	status: ProbeStatus;
	/** When the probe entered the state the message reports. */
	statusSince: Date;
	checkedAt: Date;
	consecutiveFailures: number;
	latencyMs: number;
	message: string | null;
	nextExpectedAt: Date | null;
};

export type NotificationInput = {
	probe: Pick<Probe, "key" | "label" | "criticality" | "kind">;
	status: ProbeStatus;
	consecutiveFailures: number;
	latencyMs: number;
	message?: string;
	nextExpectedAt?: Date;
	checkedAt: Date;
	/** Start of the current state: `checkedAt` on a transition. */
	statusSince: Date;
	previous: { status: ProbeStatus; consecutiveFailures: number } | null;
	alertAfterFailures: number;
};

/**
 * What to send to the team, or nothing.
 *
 * The worker calls this on every probe run, because the anti-flapping delay is
 * crossed while the status already reads `unavailable` — a status-change-only
 * trigger would never fire it. What matters is that a run either emits the one
 * alert of the outage, the one recovery, or nothing.
 *
 * - `low` probes never notify: they are visible on the screen only.
 * - `critical` and `important` alert on the run that reaches
 *   `alertAfterFailures` consecutive failures, exactly once per outage.
 * - `misconfigured` alerts immediately: the worker itself is misconfigured, and
 *   waiting three cycles would not make it disappear.
 * - A recovery is sent only if an alert was actually sent, which the persisted
 *   `consecutive_failures` tells across restarts. Two failures followed by a
 *   success therefore stay silent.
 * - The first observation of a probe has no previous state and never notifies.
 */
export function decideNotification(
	input: NotificationInput,
): ProbeNotification | null {
	const {
		probe,
		status,
		consecutiveFailures,
		latencyMs,
		message,
		nextExpectedAt,
		checkedAt,
		statusSince,
		previous,
		alertAfterFailures,
	} = input;

	if (!previous) return null;
	if (probe.criticality === "low") return null;

	const notification = (kind: NotificationKind): ProbeNotification => ({
		kind,
		probe: {
			key: probe.key,
			label: probe.label,
			criticality: probe.criticality,
			kind: probe.kind,
		},
		status,
		statusSince,
		checkedAt,
		consecutiveFailures,
		latencyMs,
		message: message ?? null,
		nextExpectedAt: nextExpectedAt ?? null,
	});

	if (status === "operational") {
		if (previous.status === "operational") return null;
		const alerted =
			previous.status === "misconfigured" ||
			previous.consecutiveFailures >= alertAfterFailures;
		return alerted ? notification("recovery") : null;
	}

	if (status === "misconfigured") {
		return previous.status === "misconfigured" ? null : notification("alert");
	}

	return consecutiveFailures === alertAfterFailures
		? notification("alert")
		: null;
}
