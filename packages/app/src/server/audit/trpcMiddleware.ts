import "server-only";

import { TRPCError } from "@trpc/server";
import type { AuditActionKey, AuditMetadata } from "~/modules/audit";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { parseSiren } from "~/modules/domain";
import { emitActivityLog } from "./activityLog";
import { logAction } from "./log";
import { buildRequestContext } from "./requestContext";

/**
 * Static mapping `${routerName}.${procedureName}` → audit action key.
 *
 * Only mutations and explicit sensitive queries are listed here. Anything not
 * in the map is silently skipped by the middleware (no audit log written).
 */
const PROCEDURE_TO_ACTION: Record<string, AuditActionKey> = {
	// ── declaration mutations ──────────────────────────────
	"declaration.updateStep1": AUDIT_ACTIONS.DECLARATION_UPDATE_STEP_1,
	"declaration.updateStep2": AUDIT_ACTIONS.DECLARATION_UPDATE_STEP_2,
	"declaration.updateStep3": AUDIT_ACTIONS.DECLARATION_UPDATE_STEP_3,
	"declaration.updateStep4": AUDIT_ACTIONS.DECLARATION_UPDATE_STEP_4,
	"declaration.updateEmployeeCategories":
		AUDIT_ACTIONS.DECLARATION_UPDATE_EMPLOYEE_CATEGORIES,
	"declaration.submit": AUDIT_ACTIONS.DECLARATION_SUBMIT,
	"declaration.submitSecondDeclaration":
		AUDIT_ACTIONS.DECLARATION_SUBMIT_SECOND,
	"declaration.saveCompliancePath":
		AUDIT_ACTIONS.DECLARATION_SAVE_COMPLIANCE_PATH,
	"declaration.submitJointEvaluation":
		AUDIT_ACTIONS.DECLARATION_SUBMIT_JOINT_EVALUATION,

	// ── declaration sensitive query (returns GIP MDS data) ─
	"declaration.getOrCreate": AUDIT_ACTIONS.DECLARATION_READ_GIP_DATA,
	"declaration.getStatusHistory": AUDIT_ACTIONS.DECLARATION_HISTORY_READ,

	// ── declaration lock sensitive reads (expose holder PII) ─
	"declarationLock.getActiveLockForCurrentDeclaration":
		AUDIT_ACTIONS.DECLARATION_LOCK_STATE_READ,
	"declarationLock.getLockState": AUDIT_ACTIONS.DECLARATION_LOCK_STATE_READ,

	// ── cse opinion mutations ──────────────────────────────
	"cseOpinion.saveOpinions": AUDIT_ACTIONS.CSE_OPINION_SAVE,
	"cseOpinion.deleteFile": AUDIT_ACTIONS.CSE_OPINION_DELETE_FILE,
	"cseOpinion.finalize": AUDIT_ACTIONS.CSE_OPINION_FINALIZE,
	"cseOpinion.setFileContentTypes": AUDIT_ACTIONS.CSE_OPINION_SET_FILE_TYPES,

	// ── joint evaluation sensitive read (exposes filed report) ─
	"jointEvaluation.getFile": AUDIT_ACTIONS.JOINT_EVALUATION_GET_FILE,

	// ── company mutations ──────────────────────────────────
	"company.get": AUDIT_ACTIONS.COMPANY_READ_GIP_DATA,
	"company.getWithDeclarations": AUDIT_ACTIONS.COMPANY_READ_GIP_DATA,
	"company.updateHasCse": AUDIT_ACTIONS.COMPANY_UPDATE_HAS_CSE,

	// ── profile mutations + sensitive read ─────────────────
	"profile.updatePhone": AUDIT_ACTIONS.PROFILE_UPDATE_PHONE,
	"profile.updateProfile": AUDIT_ACTIONS.PROFILE_UPDATE,
	"profile.get": AUDIT_ACTIONS.PROFILE_READ,

	// ── admin sensitive reads ─────────────────────────────
	"adminDeclarations.search": AUDIT_ACTIONS.ADMIN_DECLARATIONS_SEARCH,
	"adminDeclarations.getById": AUDIT_ACTIONS.ADMIN_DECLARATION_GET_BY_ID,
	"adminDeclarations.getRecap": AUDIT_ACTIONS.ADMIN_DECLARATIONS_GET_RECAP,
	"admin.searchCompany": AUDIT_ACTIONS.ADMIN_SEARCH_COMPANY,

	// ── admin declaration mutations ───────────────────────
	"adminDeclarations.cancel": AUDIT_ACTIONS.ADMIN_DECLARATION_CANCEL,
	"adminDeclarations.releaseLock": AUDIT_ACTIONS.ADMIN_DECLARATION_RELEASE_LOCK,

	// ── public searches ────────────────────────────────────
	"publicReferents.search": AUDIT_ACTIONS.PUBLIC_REFERENT_SEARCH,
	"publicReferents.getById": AUDIT_ACTIONS.PUBLIC_REFERENT_VIEW,

	// ── admin settings mutations ──────────────────────────
	"adminSettings.upsertCampaignDeadlines":
		AUDIT_ACTIONS.ADMIN_SETTINGS_UPSERT_DEADLINES,
	"adminSettings.updateLockTimeout":
		AUDIT_ACTIONS.ADMIN_SETTINGS_UPDATE_LOCK_TIMEOUT,
	"adminSettings.getRepresentationCampaignByYear":
		AUDIT_ACTIONS.ADMIN_SETTINGS_GET_REPRESENTATION_CAMPAIGN,
	"adminSettings.upsertRepresentationCampaign":
		AUDIT_ACTIONS.ADMIN_SETTINGS_UPSERT_REPRESENTATION_CAMPAIGN,

	// ── admin stats sensitive reads ──────────────────────
	"adminStats.getCampaignProgression":
		AUDIT_ACTIONS.ADMIN_STATS_CAMPAIGN_PROGRESSION,
	"adminStats.getCampaignStats": AUDIT_ACTIONS.ADMIN_STATS_GET_CAMPAIGN_STATS,
	"adminStats.getStepDurations": AUDIT_ACTIONS.ADMIN_STATS_GET_STEP_DURATIONS,
	"adminStats.getStepDropoffRate":
		AUDIT_ACTIONS.ADMIN_STATS_GET_STEP_DROPOFF_RATE,
	"adminStats.getCompletionFunnel":
		AUDIT_ACTIONS.ADMIN_STATS_GET_COMPLETION_FUNNEL,
	"adminStats.getMatomoFunnel": AUDIT_ACTIONS.ADMIN_STATS_GET_MATOMO_FUNNEL,
	"adminStats.getMatomoCategoryModel":
		AUDIT_ACTIONS.ADMIN_STATS_GET_MATOMO_CATEGORY_MODEL,
	"adminStats.getMatomoHelpLinks":
		AUDIT_ACTIONS.ADMIN_STATS_GET_MATOMO_HELP_LINKS,
	"adminStats.getMatomoDeviceBreakdown":
		AUDIT_ACTIONS.ADMIN_STATS_GET_MATOMO_DEVICE_BREAKDOWN,
	"adminStats.getMatomoCseStatusConfirmations":
		AUDIT_ACTIONS.ADMIN_STATS_GET_CSE_STATUS_CONFIRMATIONS,
	"adminStats.getUsersPerCompany":
		AUDIT_ACTIONS.ADMIN_STATS_GET_USERS_PER_COMPANY,

	// ── gip mds ────────────────────────────────────────────
	"gipMds.importFromUrl": AUDIT_ACTIONS.GIP_MDS_IMPORT,

	// ── declaration draft ─────────────────────────────────
	"declarationDraft.get": AUDIT_ACTIONS.DRAFT_READ,
	"declarationDraft.save": AUDIT_ACTIONS.DRAFT_SAVE,
	"declarationDraft.clear": AUDIT_ACTIONS.DRAFT_CLEAR,

	// ── representation declaration ─────────────────────────
	"representationDeclaration.get": AUDIT_ACTIONS.REPRESENTATION_GET,
	"representationDeclaration.saveDraft":
		AUDIT_ACTIONS.REPRESENTATION_SAVE_DRAFT,
	"representationDeclaration.submit": AUDIT_ACTIONS.REPRESENTATION_SUBMIT,
	"representationDeclaration.declareNotSubject":
		AUDIT_ACTIONS.REPRESENTATION_DECLARE_NOT_SUBJECT,

	// ── mail ──────────────────────────────────────────────
	"mail.resendReceipt": AUDIT_ACTIONS.MAIL_RECEIPT_RESEND,
};

/**
 * Per-path metadata allowlist. When a path is listed here, only these input
 * keys are kept in `audit.action_log.metadata` — everything else on the raw
 * input (percentages, free-text fields, etc.) is dropped before sanitization.
 * Paths not listed keep the default behavior (full sanitized input).
 */
const METADATA_ALLOWED_KEYS: Partial<Record<string, readonly string[]>> = {
	"representationDeclaration.get": ["year"],
	"representationDeclaration.saveDraft": ["year"],
	"representationDeclaration.submit": ["year"],
	"representationDeclaration.declareNotSubject": ["year"],
};

type SessionLike = {
	user?: {
		id?: string | null;
		email?: string | null;
		siret?: string | null;
	} | null;
} | null;

type ProcedureType = "query" | "mutation" | "subscription";

type AuditMiddlewareInput<TResult> = {
	ctx: {
		session: SessionLike;
		headers: Headers;
	};
	type: ProcedureType;
	path: string;
	getRawInput: () => Promise<unknown>;
	next: () => Promise<TResult>;
};

// tRPC v11's next() resolves { ok: false, error } for a downstream failure
// instead of throwing (#3705 §5) — this is the one place that recognizes it.
function extractMiddlewareFailure(
	result: unknown,
): { errorCode: string; errorMessage: string } | null {
	if (
		typeof result !== "object" ||
		result === null ||
		!("ok" in result) ||
		(result as { ok: unknown }).ok !== false ||
		!("error" in result)
	) {
		return null;
	}

	const error = (result as { error: unknown }).error;
	if (!(error instanceof TRPCError)) return null;

	return {
		errorCode: error.code,
		errorMessage: `${error.code}: ${error.message}`,
	};
}

// Mirrors every tRPC call — mapped or not — to the stdout activity log (#3705), on top of the existing audit.action_log write for mapped paths.
export async function auditMiddleware<TResult>({
	ctx,
	type,
	path,
	getRawInput,
	next,
}: AuditMiddlewareInput<TResult>): Promise<TResult> {
	const action = PROCEDURE_TO_ACTION[path];
	const requestContext = buildRequestContext(ctx.headers);
	const userId = ctx.session?.user?.id ?? null;
	const siren = parseSiren(ctx.session?.user?.siret);

	// Unmapped path: no audit.action_log row, but still a stdout line (#3705 §2).
	if (!action) {
		const startedAt = Date.now();
		let rawInput: unknown;
		try {
			rawInput = await getRawInput();
		} catch {
			rawInput = undefined;
		}

		try {
			const result = await next();
			const failure = extractMiddlewareFailure(result);
			emitActivityLog({
				source: "trpc",
				action: null,
				category: null,
				route: path,
				operation: type,
				status: failure ? "failure" : "success",
				errorCode: failure?.errorCode ?? null,
				durationMs: Date.now() - startedAt,
				userId,
				siren,
				ip: requestContext.ipAddress,
				rawInput,
			});
			return result;
		} catch (error) {
			emitActivityLog({
				source: "trpc",
				action: null,
				category: null,
				route: path,
				operation: type,
				status: "failure",
				errorCode: error instanceof TRPCError ? error.code : "ERROR",
				durationMs: Date.now() - startedAt,
				userId,
				siren,
				ip: requestContext.ipAddress,
				rawInput,
			});
			throw error;
		}
	}

	const startedAt = Date.now();
	const userEmail = ctx.session?.user?.email ?? null;
	let rawInput: unknown;
	try {
		rawInput = await getRawInput();
	} catch {
		rawInput = undefined;
	}
	const metadata = sanitizeMetadata(rawInput, path);
	const origin = { source: "trpc" as const, route: path, operation: type };

	try {
		const result = await next();
		const durationMs = Date.now() - startedAt;
		const failure = extractMiddlewareFailure(result);

		void logAction({
			action,
			status: failure ? "failure" : "success",
			userId,
			userEmail,
			siren,
			metadata,
			errorMessage: failure?.errorMessage,
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs,
			origin,
		});
		return result;
	} catch (error) {
		const errorMessage =
			error instanceof TRPCError
				? `${error.code}: ${error.message}`
				: error instanceof Error
					? error.message
					: "Unknown error";

		void logAction({
			action,
			status: "failure",
			userId,
			userEmail,
			siren,
			metadata,
			errorMessage,
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
			origin,
		});
		throw error;
	}
}

/**
 * Convert raw tRPC input into an AuditMetadata object suitable for jsonb
 * storage. Recursively walks objects and arrays to drop `undefined` fields
 * and strip obviously-technical sensitive keys at every depth.
 *
 * When `path` has an entry in {@link METADATA_ALLOWED_KEYS}, only those top-level
 * input keys are kept before sanitization.
 *
 * Wraps non-object scalars into `{ value }` so the column can stay typed as
 * `Record<string, unknown>`.
 */
function sanitizeMetadata(
	rawInput: unknown,
	path: string,
): AuditMetadata | null {
	if (rawInput === undefined || rawInput === null) return null;

	const allowedKeys = METADATA_ALLOWED_KEYS[path];
	const scopedInput =
		allowedKeys && typeof rawInput === "object" && !Array.isArray(rawInput)
			? Object.fromEntries(
					allowedKeys
						.filter((key) => key in (rawInput as Record<string, unknown>))
						.map((key) => [key, (rawInput as Record<string, unknown>)[key]]),
				)
			: rawInput;

	const sanitized = sanitizeValue(scopedInput);
	if (sanitized === undefined) return null;

	if (
		typeof sanitized === "object" &&
		sanitized !== null &&
		!Array.isArray(sanitized)
	) {
		const obj = sanitized as AuditMetadata;
		return Object.keys(obj).length > 0 ? obj : null;
	}

	return { value: sanitized as AuditMetadata[string] };
}

/**
 * Recursive helper for {@link sanitizeMetadata}: returns `undefined` for
 * dropped values, the value itself otherwise.
 */
function sanitizeValue(value: unknown): unknown {
	if (value === undefined) return undefined;
	if (value === null) return null;

	if (Array.isArray(value)) {
		return value.map((entry) => sanitizeValue(entry));
	}

	if (typeof value === "object") {
		const result: AuditMetadata = {};
		for (const [key, child] of Object.entries(value as AuditMetadata)) {
			if (child === undefined) continue;
			if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
			const sanitizedChild = sanitizeValue(child);
			if (sanitizedChild === undefined) continue;
			result[key] = sanitizedChild;
		}
		return result;
	}

	return value;
}

const SENSITIVE_KEYS = new Set([
	"password",
	"token",
	"refresh_token",
	"secret",
	"client_secret",
	"authorization",
	"apikey",
	"api_key",
	"accesskey",
	"access_key",
	"private_key",
	"data",
	// Identity PII: the row already carries user_email, and audit-logging.md
	// forbids duplicating PII that is not the email or the siren.
	"firstname",
	"lastname",
]);
