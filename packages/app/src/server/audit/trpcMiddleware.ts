import "server-only";

import { TRPCError } from "@trpc/server";
import type { AuditActionKey, AuditMetadata } from "~/modules/audit";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { parseSiren } from "~/modules/domain";
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

	// ── cse opinion mutations ──────────────────────────────
	"cseOpinion.saveOpinions": AUDIT_ACTIONS.CSE_OPINION_SAVE,
	"cseOpinion.deleteFile": AUDIT_ACTIONS.CSE_OPINION_DELETE_FILE,
	"cseOpinion.finalize": AUDIT_ACTIONS.CSE_OPINION_FINALIZE,

	// ── company mutations ──────────────────────────────────
	"company.updateHasCse": AUDIT_ACTIONS.COMPANY_UPDATE_HAS_CSE,

	// ── profile mutations + sensitive read ─────────────────
	"profile.updatePhone": AUDIT_ACTIONS.PROFILE_UPDATE_PHONE,
	"profile.get": AUDIT_ACTIONS.PROFILE_READ,

	// ── admin sensitive reads ─────────────────────────────
	"adminDeclarations.search": AUDIT_ACTIONS.ADMIN_DECLARATIONS_SEARCH,
	"adminDeclarations.getById": AUDIT_ACTIONS.ADMIN_DECLARATION_GET_BY_ID,

	// ── admin declaration mutations ───────────────────────
	"adminDeclarations.cancel": AUDIT_ACTIONS.ADMIN_DECLARATION_CANCEL,

	// ── public searches ────────────────────────────────────
	"publicReferents.search": AUDIT_ACTIONS.PUBLIC_REFERENT_SEARCH,
	"publicReferents.getById": AUDIT_ACTIONS.PUBLIC_REFERENT_VIEW,

	// ── admin settings mutations ──────────────────────────
	"adminSettings.upsertCampaignDeadlines":
		AUDIT_ACTIONS.ADMIN_SETTINGS_UPSERT_DEADLINES,

	// ── admin stats sensitive reads ──────────────────────
	"adminStats.getCampaignProgression":
		AUDIT_ACTIONS.ADMIN_STATS_CAMPAIGN_PROGRESSION,
	"adminStats.getCampaignStats": AUDIT_ACTIONS.ADMIN_STATS_GET_CAMPAIGN_STATS,
	"adminStats.getStepDurations": AUDIT_ACTIONS.ADMIN_STATS_GET_STEP_DURATIONS,

	// ── gip mds ────────────────────────────────────────────
	"gipMds.importFromUrl": AUDIT_ACTIONS.GIP_MDS_IMPORT,

	// ── mail ──────────────────────────────────────────────
	"mail.resendReceipt": AUDIT_ACTIONS.MAIL_RECEIPT_RESEND,
};

type SessionLike = {
	user?: {
		id?: string | null;
		email?: string | null;
		siret?: string | null;
	} | null;
} | null;

type AuditMiddlewareInput<TResult> = {
	ctx: {
		session: SessionLike;
		headers: Headers;
	};
	path: string;
	getRawInput: () => Promise<unknown>;
	next: () => Promise<TResult>;
};

/**
 * Generic helper that records every mutation and every explicitly-listed
 * sensitive query into `audit.action_log`.
 *
 * Designed to be wrapped in a `t.middleware(...)` call from `~/server/api/trpc`
 * (kept generic so it returns whatever the tRPC pipeline expects).
 *
 * - Lookup is path-based (e.g. `declaration.submit`) — paths not in the map
 *   are skipped.
 * - Captures status, duration, error message, user identity and request
 *   metadata (IP, user-agent).
 * - Always re-throws errors so the audit log never alters business behavior.
 */
export async function auditMiddleware<TResult>({
	ctx,
	path,
	getRawInput,
	next,
}: AuditMiddlewareInput<TResult>): Promise<TResult> {
	const action = PROCEDURE_TO_ACTION[path];

	// Path is not auditable — short-circuit, no overhead beyond the lookup.
	if (!action) {
		return next();
	}

	const startedAt = Date.now();
	const requestContext = buildRequestContext(ctx.headers);
	const userId = ctx.session?.user?.id ?? null;
	const userEmail = ctx.session?.user?.email ?? null;
	const siren = parseSiren(ctx.session?.user?.siret);
	let rawInput: unknown;
	try {
		rawInput = await getRawInput();
	} catch {
		rawInput = undefined;
	}
	const metadata = sanitizeMetadata(rawInput);

	try {
		const result = await next();
		void logAction({
			action,
			status: "success",
			userId,
			userEmail,
			siren,
			metadata,
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
			durationMs: Date.now() - startedAt,
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
		});
		throw error;
	}
}

/**
 * Convert raw tRPC input into an AuditMetadata object suitable for jsonb
 * storage. Recursively walks objects and arrays to drop `undefined` fields
 * and strip obviously-technical sensitive keys at every depth.
 *
 * Wraps non-object scalars into `{ value }` so the column can stay typed as
 * `Record<string, unknown>`.
 */
function sanitizeMetadata(rawInput: unknown): AuditMetadata | null {
	if (rawInput === undefined || rawInput === null) return null;

	const sanitized = sanitizeValue(rawInput);
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
]);
