import type { ProbeCriticality } from "../types.js";

/**
 * Cron definitions of the scheduled jobs the worker watches.
 *
 * These four are K8s CronJobs (`.kontinuous/templates/*-cron.yaml`, UTC). Their
 * schedule is repeated here on purpose: the freshness rule belongs to this
 * worker, the screen must not re-derive a cron, and reading the CronJob object
 * would need a Kubernetes API client and RBAC we refuse. When a manifest's
 * `schedule:` changes, change it here too — both `next_expected_at` and the
 * staleness window come from this line.
 *
 * The e-mail reminder schedules are *not* here: pg-boss owns them (the
 * notifications worker registers them at boot), so the probes read the cron
 * from `pgboss.schedule` instead of keeping a second copy.
 */
export type AuditJobDefinition = {
	/** Stable probe key, also the `app_health_probe.key`. */
	key: string;
	label: string;
	/** Value of `audit.action_log.action`. */
	action: string;
	cron: string;
	timeZone: string;
	criticality: ProbeCriticality;
	/**
	 * A success line is only believed when a row backs it. The export route
	 * writes its audit line through `withAuditedRoute`, so a 200 without an
	 * `app_export` row would otherwise read as a healthy job.
	 */
	corroboration?: "export-archive";
};

export const AUDIT_JOB_DEFINITIONS: readonly AuditJobDefinition[] = [
	{
		key: "job-export-generate",
		label: "Génération de l'export annuel",
		action: "export.generate",
		cron: "0 2 * * *",
		timeZone: "UTC",
		criticality: "critical",
		corroboration: "export-archive",
	},
	{
		key: "job-gip-mds-import",
		label: "Import GIP-MDS",
		action: "gip_mds.import",
		cron: "0 3 * * *",
		timeZone: "UTC",
		criticality: "critical",
	},
	{
		key: "job-declaration-cleanup",
		label: "Purge des déclarations",
		action: "system.declaration_cleanup",
		cron: "0 3 * * *",
		timeZone: "UTC",
		criticality: "critical",
	},
	{
		key: "job-audit-cleanup",
		label: "Purge du journal d'audit",
		action: "system.audit_cleanup",
		cron: "0 4 * * *",
		timeZone: "UTC",
		criticality: "critical",
	},
];
