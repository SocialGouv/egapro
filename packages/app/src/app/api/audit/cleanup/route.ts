import { env } from "~/env.js";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { cleanupAuditLogs } from "~/server/audit/cleanup";
import { logAction } from "~/server/audit/log";

/**
 * POST /api/audit/cleanup
 *
 * Delete audit log rows older than the configured retention thresholds
 * (CNIL: 6 months for `read_sensitive`, 12 months for everything else).
 *
 * Called by the K8s CronJob (audit-cleanup) with a Bearer token for
 * authentication. Issue #3174.
 */
export async function POST(request: Request) {
	// Fail-closed: refuse the request if no token is configured. This route
	// destroys data — a missing secret should never make it world-readable.
	const token = env.EGAPRO_AUDIT_CLEANUP_TOKEN;
	if (!token) {
		console.error(
			"[audit/cleanup] EGAPRO_AUDIT_CLEANUP_TOKEN is not configured — refusing request",
		);
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${token}`) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await cleanupAuditLogs({
			shortRetentionDays: env.EGAPRO_AUDIT_RETENTION_SHORT_DAYS,
			longRetentionDays: env.EGAPRO_AUDIT_RETENTION_LONG_DAYS,
		});

		// Self-audit so the cleanup itself appears in the table — useful to
		// confirm the cron is running and to track how many rows were purged.
		void logAction({
			action: AUDIT_ACTIONS.SYSTEM_AUDIT_CLEANUP,
			status: "success",
			metadata: {
				deletedShort: result.deletedShort,
				deletedLong: result.deletedLong,
				deletedTotal: result.deletedTotal,
				shortRetentionDays: env.EGAPRO_AUDIT_RETENTION_SHORT_DAYS,
				longRetentionDays: env.EGAPRO_AUDIT_RETENTION_LONG_DAYS,
			},
		});

		return Response.json({ success: true, ...result });
	} catch (error) {
		console.error("[audit/cleanup] Failed:", error);
		void logAction({
			action: AUDIT_ACTIONS.SYSTEM_AUDIT_CLEANUP,
			status: "failure",
			errorMessage: error instanceof Error ? error.message : "Unknown error",
		});
		return Response.json({ error: "Audit cleanup failed" }, { status: 500 });
	}
}
