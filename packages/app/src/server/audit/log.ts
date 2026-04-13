import "server-only";

import type {
	AuditActionKey,
	AuditCategory,
	AuditMetadata,
	AuditStatus,
} from "~/modules/audit";
import { AUDIT_ACTION_CATEGORIES } from "~/modules/audit";
import { db } from "~/server/db";
import { actionLogs } from "~/server/db/auditSchema";

export type LogActionInput = {
	action: AuditActionKey;
	status: AuditStatus;
	userId?: string | null;
	userEmail?: string | null;
	siren?: string | null;
	resourceType?: string | null;
	resourceId?: string | null;
	errorMessage?: string | null;
	metadata?: AuditMetadata | null;
	ipAddress?: string | null;
	userAgent?: string | null;
	durationMs?: number | null;
	/**
	 * Optional override — falls back to AUDIT_ACTION_CATEGORIES[action].
	 * Mostly useful for tests; production code should rely on the static map.
	 */
	category?: AuditCategory;
};

/**
 * Append a row to `audit.action_log`.
 *
 * Fail-safe by design — every failure during logging is swallowed and reported
 * to the console. Audit logging must NEVER block business logic, so the
 * caller's promise will resolve regardless of the insert outcome.
 */
export async function logAction(input: LogActionInput): Promise<void> {
	try {
		const category = input.category ?? AUDIT_ACTION_CATEGORIES[input.action];

		await db.insert(actionLogs).values({
			action: input.action,
			category,
			status: input.status,
			userId: input.userId ?? null,
			userEmail: input.userEmail ?? null,
			siren: input.siren ?? null,
			resourceType: input.resourceType ?? null,
			resourceId: input.resourceId ?? null,
			errorMessage: input.errorMessage ?? null,
			metadata: input.metadata ?? null,
			ipAddress: input.ipAddress ?? null,
			userAgent: input.userAgent ?? null,
			durationMs: input.durationMs ?? null,
		});
	} catch (error) {
		console.error("[audit] Failed to write audit log entry", {
			action: input.action,
			error,
		});
	}
}
