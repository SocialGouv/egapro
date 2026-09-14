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
import { deriveErrorCode, emitActivityLog } from "./activityLog";

// Stdout-mirror-only fields, never persisted to audit.action_log.
export type LogActionOrigin = {
	source?: "trpc" | "route" | null;
	route?: string | null;
	operation?: string | null;
};

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
	// Overrides AUDIT_ACTION_CATEGORIES[action] — mostly for tests.
	category?: AuditCategory;
	origin?: LogActionOrigin;
};

// Fail-safe: every failure below is swallowed so the caller's promise always resolves; the stdout mirror runs first, in its own try/catch, and can never suppress the DB insert.
export async function logAction(input: LogActionInput): Promise<void> {
	const category = input.category ?? AUDIT_ACTION_CATEGORIES[input.action];

	try {
		emitActivityLog({
			source: input.origin?.source ?? null,
			action: input.action,
			category,
			route: input.origin?.route ?? null,
			operation: input.origin?.operation ?? null,
			status: input.status,
			errorCode: deriveErrorCode(input.errorMessage),
			durationMs: input.durationMs ?? null,
			userId: input.userId ?? null,
			siren: input.siren ?? null,
			ip: input.ipAddress ?? null,
			rawInput: input.metadata ?? null,
		});
	} catch (error) {
		console.error("[audit] Failed to emit activity log line", {
			action: input.action,
			error,
		});
	}

	try {
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
