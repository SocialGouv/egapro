import type { Sql } from "postgres";

import { isNotificationType } from "../mails/index.js";
import type { NotificationType } from "../queue.js";

const ERROR_CODES = [
	"invalid_job",
	"mail_render_failed",
	"mail_transport_failed",
	"notification_failed",
] as const;

type ErrorCode = (typeof ERROR_CODES)[number];

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIREN_RE = /^\d{9}$/;

export type AuditRow = {
	status: "success" | "failure";
	userId?: string | null;
	siren?: string | null;
	resourceId?: string | null;
	errorCode?: ErrorCode;
	metadata?: {
		type?: NotificationType;
		attempt?: number;
		poisonPill?: boolean;
	};
};

export async function logAuditMain(
	mainSql: Sql | null,
	row: AuditRow,
): Promise<void> {
	if (!mainSql) return;
	const rawMetadata = row.metadata;
	const metadata = {
		...(isNotificationType(rawMetadata?.type)
			? { type: rawMetadata.type }
			: {}),
		...(typeof rawMetadata?.attempt === "number" &&
		Number.isSafeInteger(rawMetadata.attempt) &&
		rawMetadata.attempt > 0
			? { attempt: Math.min(rawMetadata.attempt, 1000) }
			: {}),
		...(typeof rawMetadata?.poisonPill === "boolean"
			? { poisonPill: rawMetadata.poisonPill }
			: {}),
	};
	const status = row.status === "success" ? "success" : "failure";
	const requestedErrorCode = row.errorCode;
	const errorCode =
		status === "failure"
			? requestedErrorCode !== undefined &&
				ERROR_CODES.includes(requestedErrorCode)
				? requestedErrorCode
				: "notification_failed"
			: null;
	try {
		await mainSql`
			INSERT INTO audit.action_log (
				id, created_at, action, category, status,
				user_id, siren, resource_type, resource_id,
				error_message, metadata
			)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${"notification.send"},
				${"system"},
				${status},
				${typeof row.userId === "string" && UUID_RE.test(row.userId) ? row.userId : null},
				${typeof row.siren === "string" && SIREN_RE.test(row.siren) ? row.siren : null},
				${"notification"},
				${typeof row.resourceId === "string" && UUID_RE.test(row.resourceId) ? row.resourceId : null},
				${errorCode},
				${mainSql.json(metadata)}
			)
		`;
	} catch {
		console.error("[notifications] audit insert failed");
	}
}
