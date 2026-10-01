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
import { deriveErrorCode, emitActivityLog, truncateIp } from "./activityLog";
import { projectAuditMetadata } from "./metadata";

// Stdout-mirror-only fields, never persisted to audit.action_log.
export type LogActionOrigin = {
	source?: "trpc" | "route" | null;
	route?: string | null;
	operation?: string | null;
	// Only auditMiddleware sets this key (source "trpc"); its values only ever reach `inputKeys`, never `input`, since activityLog.ts nulls `input` for that source — a "route" caller setting this would not get that guard.
	rawInput?: unknown;
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

const DATABASE_ERROR_CODES = new Set([
	"ERROR",
	"BAD_REQUEST",
	"UNAUTHORIZED",
	"FORBIDDEN",
	"NOT_FOUND",
	"METHOD_NOT_SUPPORTED",
	"TIMEOUT",
	"CONFLICT",
	"PRECONDITION_FAILED",
	"PAYLOAD_TOO_LARGE",
	"UNPROCESSABLE_CONTENT",
	"TOO_MANY_REQUESTS",
	"CLIENT_CLOSED_REQUEST",
	"INTERNAL_SERVER_ERROR",
	"NOT_IMPLEMENTED",
	"BAD_GATEWAY",
	"SERVICE_UNAVAILABLE",
	"GATEWAY_TIMEOUT",
	"OAUTH_CALLBACK_ERROR",
	"OAUTH_CALLBACK_HANDLER_ERROR",
	"OAUTH_PARSE_PROFILE_ERROR",
	"SIGNIN_OAUTH_ERROR",
	"JWT_SESSION_ERROR",
]);
const RESOURCE_TYPES = new Set(["declaration", "notification"]);
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIREN_PATTERN = /^\d{9}$/;

function resourceType(value: string | null | undefined): string | null {
	return value && RESOURCE_TYPES.has(value) ? value : null;
}

function resourceId(
	type: string | null,
	value: string | null | undefined,
): string | null {
	return type && value && UUID_PATTERN.test(value) ? value : null;
}

function userId(value: string | null | undefined): string | null {
	return value && UUID_PATTERN.test(value) ? value : null;
}

function siren(value: string | null | undefined): string | null {
	return value && SIREN_PATTERN.test(value) ? value : null;
}

function databaseErrorCode(message: string | null | undefined): string | null {
	const code = deriveErrorCode(message);
	if (!code) return null;
	if (DATABASE_ERROR_CODES.has(code)) return code;
	if (/^HTTP_[1-5]\d{2}$/.test(code)) return code;
	return "ERROR";
}

// Fail-safe: every failure below is swallowed so the caller's promise always resolves; the stdout mirror runs first, in its own try/catch, and can never suppress the DB insert.
export async function logAction(input: LogActionInput): Promise<void> {
	const category = input.category ?? AUDIT_ACTION_CATEGORIES[input.action];

	try {
		// inputKeys must reflect the caller's real input, not the allowlisted/wrapped projection persisted as `metadata`.
		const stdoutInput = input.origin?.rawInput ?? input.metadata;

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
			rawInput: stdoutInput ?? null,
		});
	} catch (error) {
		console.error("[audit] Failed to emit activity log line", {
			action: input.action,
			error,
		});
	}

	try {
		const persistedResourceType = resourceType(input.resourceType);
		await db.insert(actionLogs).values({
			action: input.action,
			category,
			status: input.status,
			userId: userId(input.userId),
			userEmail: null,
			siren: siren(input.siren),
			resourceType: persistedResourceType,
			resourceId: resourceId(persistedResourceType, input.resourceId),
			errorMessage: databaseErrorCode(input.errorMessage),
			metadata: projectAuditMetadata(input.action, input.metadata),
			ipAddress: truncateIp(input.ipAddress),
			userAgent: null,
			durationMs: input.durationMs ?? null,
		});
	} catch (error) {
		console.error("[audit] Failed to write audit log entry", {
			action: input.action,
			error,
		});
	}
}
