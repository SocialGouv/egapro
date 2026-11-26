import { formatCount } from "~/modules/domain";

import type {
	Criticality,
	DisplayStatus,
	HealthStatus,
	ScheduledJob,
	ServiceProbe,
	ServiceStatusOverviewSummary,
} from "../types";

const STATUS_LABELS: Record<DisplayStatus, string> = {
	operational: "Opérationnel",
	degraded: "Dégradé",
	unavailable: "Indisponible",
	misconfigured: "Mal configuré",
	unknown: "Inconnu",
};

const STATUS_BADGE_CLASSES: Record<DisplayStatus, string> = {
	operational: "fr-badge--success",
	degraded: "fr-badge--warning",
	unavailable: "fr-badge--error",
	misconfigured: "fr-badge--warning",
	unknown: "fr-badge--info",
};

const JOB_STATUS_LABELS: Record<DisplayStatus, string> = {
	operational: "À jour",
	degraded: "Dégradé",
	unavailable: "En retard",
	misconfigured: "Mal configuré",
	unknown: "Inconnu",
};

const CRITICALITY_LABELS: Record<Criticality, string> = {
	critical: "Critique",
	important: "Important",
	low: "Faible",
};

const STATUS_ORDER: Record<DisplayStatus, number> = {
	unavailable: 0,
	degraded: 1,
	misconfigured: 2,
	unknown: 3,
	operational: 4,
};

const CRITICALITY_ORDER: Record<Criticality, number> = {
	critical: 0,
	important: 1,
	low: 2,
};

export function statusLabel(status: DisplayStatus): string {
	return STATUS_LABELS[status];
}

export function statusBadgeClass(status: DisplayStatus): string {
	return STATUS_BADGE_CLASSES[status];
}

export function jobStatusLabel(status: DisplayStatus): string {
	return JOB_STATUS_LABELS[status];
}

export function criticalityLabel(criticality: Criticality): string {
	return CRITICALITY_LABELS[criticality];
}

/**
 * Status shown to the reader. A probe the worker stopped refreshing shows
 * "inconnu", never its last stored colour: a green dot from an hour ago is a
 * lie about the present.
 *
 * The threshold is the configured floor widened to two of the probe's own
 * cycles: partner probes run every 15 minutes, so a flat 5-minute threshold
 * would paint them unknown ten minutes out of fifteen.
 */
export function resolveDisplayStatus(
	storedStatus: HealthStatus,
	checkedAt: Date,
	now: Date,
	staleAfterSeconds: number,
	intervalSeconds: number,
): DisplayStatus {
	const thresholdMs = Math.max(staleAfterSeconds, intervalSeconds * 2) * 1000;
	const ageMs = now.getTime() - checkedAt.getTime();
	return ageMs > thresholdMs ? "unknown" : storedStatus;
}

export function compareBySeverity(
	left: ServiceProbe,
	right: ServiceProbe,
): number {
	const statusDelta = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
	if (statusDelta !== 0) return statusDelta;
	const criticalityDelta =
		CRITICALITY_ORDER[left.criticality] - CRITICALITY_ORDER[right.criticality];
	if (criticalityDelta !== 0) return criticalityDelta;
	return left.label.localeCompare(right.label, "fr");
}

export function summarizeServiceStatus(
	probes: readonly ServiceProbe[],
	jobs: readonly ScheduledJob[],
): ServiceStatusOverviewSummary {
	const rows: readonly ServiceProbe[] = [...probes, ...jobs];
	const supervisionLost =
		rows.length === 0 || rows.every((row) => row.status === "unknown");
	// A service and a scheduled job are counted apart: the tables read "1
	// service indisponible" and "1 traitement en retard", and the summary must
	// not blur the two.
	const degradedCount = rows.filter(
		(row) => row.status === "degraded" || row.status === "misconfigured",
	).length;
	const unavailableCount = probes.filter(
		(row) => row.status === "unavailable",
	).length;
	const criticalUnavailableCount = probes.filter(
		(row) => row.status === "unavailable" && row.criticality === "critical",
	).length;
	const lateJobCount = jobs.filter(
		(row) => row.status === "unavailable",
	).length;
	const bannerVisible =
		supervisionLost || criticalUnavailableCount > 0 || lateJobCount > 0;

	return {
		supervisionLost,
		degradedCount,
		unavailableCount,
		criticalUnavailableCount,
		lateJobCount,
		bannerVisible,
		tone: resolveTone(
			supervisionLost,
			unavailableCount + lateJobCount,
			degradedCount,
		),
	};
}

export function unreachableSummary(): ServiceStatusOverviewSummary {
	return {
		supervisionLost: true,
		degradedCount: 0,
		unavailableCount: 0,
		criticalUnavailableCount: 0,
		lateJobCount: 0,
		bannerVisible: true,
		tone: "error",
	};
}

function resolveTone(
	supervisionLost: boolean,
	unavailableCount: number,
	degradedCount: number,
): ServiceStatusOverviewSummary["tone"] {
	if (supervisionLost || unavailableCount > 0) return "error";
	if (degradedCount > 0) return "warning";
	return "success";
}

export function summarySentence(summary: ServiceStatusOverviewSummary): string {
	if (summary.supervisionLost) {
		return "La supervision ne répond plus.";
	}
	if (
		summary.degradedCount === 0 &&
		summary.unavailableCount === 0 &&
		summary.lateJobCount === 0
	) {
		return "Tous les services sont opérationnels.";
	}

	const parts: string[] = [];
	if (summary.degradedCount > 0) {
		parts.push(
			countLabel(summary.degradedCount, "service dégradé", "services dégradés"),
		);
	}
	if (summary.unavailableCount > 0) {
		parts.push(
			countLabel(
				summary.unavailableCount,
				"service indisponible",
				"services indisponibles",
			),
		);
	}
	if (summary.lateJobCount > 0) {
		parts.push(
			countLabel(
				summary.lateJobCount,
				"traitement planifié en retard",
				"traitements planifiés en retard",
			),
		);
	}
	return `${parts.join(", ")}.`;
}

export function bannerTitle(summary: ServiceStatusOverviewSummary): string {
	if (summary.supervisionLost) {
		return "La supervision ne répond plus";
	}
	if (summary.criticalUnavailableCount > 0) {
		return countLabel(
			summary.criticalUnavailableCount,
			"service critique est indisponible",
			"services critiques sont indisponibles",
		);
	}
	return countLabel(
		summary.lateJobCount,
		"traitement planifié est en retard",
		"traitements planifiés sont en retard",
	);
}

export function bannerBody(summary: ServiceStatusOverviewSummary): string {
	if (summary.supervisionLost) {
		return "Le sondeur n'a plus écrit dans le délai de fraîcheur : l'état affiché n'est plus fiable.";
	}
	if (summary.criticalUnavailableCount > 0) {
		return "Consultez le détail des sondes et les incidents des trente derniers jours.";
	}
	return "Consultez le détail des traitements planifiés et les incidents des trente derniers jours.";
}

function countLabel(count: number, singular: string, plural: string): string {
	return `${formatCount(count)} ${count > 1 ? plural : singular}`;
}
