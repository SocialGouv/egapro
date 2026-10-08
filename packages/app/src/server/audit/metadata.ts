import type { AuditActionKey, AuditMetadata } from "~/modules/audit";
import { AUDIT_ACTIONS } from "~/modules/audit";

type MetadataField =
	| "year"
	| "years"
	| "count"
	| "limit"
	| "format"
	| "hasCse"
	| "campaignStartDate"
	| "campaignEndDate"
	| "publicDataReleaseDate"
	| "declarationDeadline"
	| "decl1ModificationDeadline"
	| "decl1JustificationDeadline"
	| "decl1JointEvaluationDeadline"
	| "decl2ModificationDeadline"
	| "decl2JustificationDeadline"
	| "decl2JointEvaluationDeadline"
	| "decl2CseOpinionDeadline"
	| "invalidYear"
	| "acr"
	| "authTime"
	| "testSeam"
	| "timeoutMinutes"
	| "date_begin"
	| "date_end"
	| "type"
	| "kind"
	| "variant"
	| "isResend"
	| "attachmentsDropped"
	| "id"
	| "declarationId"
	| "fileId"
	| "siren"
	| "flowType"
	| "s3Cleanup"
	| "roles"
	| "publicAgentRequired"
	| "reason";

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RECEIPT_TYPES = new Set([
	"declaration_confirmation",
	"second_declaration_confirmation",
	"cse_opinion_receipt",
	"joint_evaluation_submitted",
	"representation_receipt",
]);
const RECEIPT_KINDS = new Set([
	"declaration",
	"secondDeclaration",
	"cseOpinion",
	"jointEvaluation",
	"representation",
]);
const RECEIPT_VARIANTS = new Set([
	"completed",
	"cse_to_deposit",
	"path_to_select",
	"cse_first_and_second",
	"single",
	"with_gap",
	"first_and_second",
]);

// Every action starts with no metadata. Extend this map only for a concrete
// audit need, with a validator below. Raw search text and file names are
// omitted; technical identifiers are accepted only in UUID form.
const FIELDS_BY_ACTION: Partial<
	Record<AuditActionKey, readonly MetadataField[]>
> = {
	[AUDIT_ACTIONS.DECLARATION_SUBMIT]: ["year"],
	[AUDIT_ACTIONS.DECLARATION_HISTORY_READ]: ["siren", "year"],
	[AUDIT_ACTIONS.DECLARATION_LOCK_STATE_READ]: ["declarationId"],
	[AUDIT_ACTIONS.DRAFT_READ]: ["siren", "year"],
	[AUDIT_ACTIONS.DRAFT_SAVE]: ["siren", "year"],
	[AUDIT_ACTIONS.DRAFT_CLEAR]: ["siren", "year"],
	[AUDIT_ACTIONS.COMPANY_READ_GIP_DATA]: ["siren"],
	[AUDIT_ACTIONS.COMPANY_UPDATE_HAS_CSE]: ["siren", "hasCse"],
	[AUDIT_ACTIONS.MAIL_RECEIPT_RESEND]: ["kind", "year"],
	[AUDIT_ACTIONS.PDF_SIZE_PROBE]: ["year"],
	[AUDIT_ACTIONS.ADMIN_STATS_CAMPAIGN_PROGRESSION]: ["years"],
	[AUDIT_ACTIONS.ADMIN_STATS_GET_CAMPAIGN_STATS]: ["year"],
	[AUDIT_ACTIONS.ADMIN_STATS_GET_STEP_DURATIONS]: ["year"],
	[AUDIT_ACTIONS.ADMIN_STATS_GET_STEP_DROPOFF_RATE]: ["year"],
	[AUDIT_ACTIONS.ADMIN_STATS_GET_COMPLETION_FUNNEL]: ["year"],
	[AUDIT_ACTIONS.ADMIN_STATS_GET_MATOMO_FUNNEL]: ["year"],
	[AUDIT_ACTIONS.ADMIN_STATS_GET_MATOMO_CATEGORY_MODEL]: ["year"],
	[AUDIT_ACTIONS.ADMIN_STATS_GET_MATOMO_HELP_LINKS]: ["year"],
	[AUDIT_ACTIONS.ADMIN_STATS_GET_MATOMO_DEVICE_BREAKDOWN]: ["year"],
	[AUDIT_ACTIONS.ADMIN_STATS_GET_CSE_STATUS_CONFIRMATIONS]: ["year"],
	[AUDIT_ACTIONS.ADMIN_STATS_GET_USERS_PER_COMPANY]: ["year"],
	[AUDIT_ACTIONS.ADMIN_SETTINGS_UPSERT_REPRESENTATION_CAMPAIGN]: [
		"year",
		"campaignStartDate",
		"campaignEndDate",
		"declarationDeadline",
	],
	[AUDIT_ACTIONS.ADMIN_SETTINGS_UPSERT_DEADLINES]: [
		"year",
		"decl1ModificationDeadline",
		"decl1JustificationDeadline",
		"decl1JointEvaluationDeadline",
		"decl2ModificationDeadline",
		"decl2JustificationDeadline",
		"decl2JointEvaluationDeadline",
		"decl2CseOpinionDeadline",
	],
	[AUDIT_ACTIONS.ADMIN_SETTINGS_UPDATE_COMMON_CALENDAR]: [
		"year",
		"campaignStartDate",
		"publicDataReleaseDate",
	],
	[AUDIT_ACTIONS.ADMIN_SETTINGS_GET_REPRESENTATION_CAMPAIGN]: ["year"],
	[AUDIT_ACTIONS.REPRESENTATION_GET]: ["year"],
	[AUDIT_ACTIONS.REPRESENTATION_SAVE_DRAFT]: ["year"],
	[AUDIT_ACTIONS.REPRESENTATION_SUBMIT]: ["year"],
	[AUDIT_ACTIONS.REPRESENTATION_DECLARE_NOT_SUBJECT]: ["year"],
	[AUDIT_ACTIONS.PDF_DECLARATION_DOWNLOAD]: ["year"],
	[AUDIT_ACTIONS.PDF_TRANSMITTED_DOWNLOAD]: ["year"],
	[AUDIT_ACTIONS.PDF_REPRESENTATION_DOWNLOAD]: ["year"],
	[AUDIT_ACTIONS.PDF_PREFILL_DOWNLOAD]: ["year", "invalidYear"],
	[AUDIT_ACTIONS.EXPORT_GENERATE]: ["year"],
	[AUDIT_ACTIONS.EXPORT_DOWNLOAD]: ["year"],
	[AUDIT_ACTIONS.EXPORT_API_DECLARATIONS]: ["year", "date_begin", "date_end"],
	[AUDIT_ACTIONS.EXPORT_API_REPRESENTATIONS]: [
		"year",
		"date_begin",
		"date_end",
	],
	[AUDIT_ACTIONS.EXPORT_API_FILES]: ["year", "fileId"],
	[AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN]: ["count", "limit"],
	[AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_BY_SIREN]: ["count", "limit"],
	[AUDIT_ACTIONS.PUBLIC_DECLARATIONS_BY_SIREN_YEAR]: ["year"],
	[AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_BY_SIREN_YEAR]: ["year"],
	[AUDIT_ACTIONS.PUBLIC_DECLARATIONS_EXPORT]: ["format"],
	[AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_EXPORT]: ["format"],
	[AUDIT_ACTIONS.PUBLIC_REFERENT_SEARCH]: ["format"],
	[AUDIT_ACTIONS.AUTH_ADMIN_MFA]: [
		"acr",
		"authTime",
		"testSeam",
		"roles",
		"publicAgentRequired",
	],
	[AUDIT_ACTIONS.AUTH_COMPANY_LINK_REVOKED]: ["reason"],
	[AUDIT_ACTIONS.DECLARATION_LOCK_RELEASED]: ["reason"],
	[AUDIT_ACTIONS.ADMIN_SETTINGS_UPDATE_LOCK_TIMEOUT]: ["timeoutMinutes"],
	[AUDIT_ACTIONS.ADMIN_DECLARATION_GET_BY_ID]: ["id"],
	[AUDIT_ACTIONS.ADMIN_DECLARATIONS_GET_RECAP]: ["id"],
	[AUDIT_ACTIONS.ADMIN_DECLARATION_CANCEL]: ["id"],
	[AUDIT_ACTIONS.ADMIN_DECLARATION_RELEASE_LOCK]: ["declarationId"],
	[AUDIT_ACTIONS.PUBLIC_REFERENT_VIEW]: ["id"],
	[AUDIT_ACTIONS.ADMIN_SEARCH_COMPANY]: ["siren"],
	[AUDIT_ACTIONS.CSE_OPINION_DELETE_FILE]: ["fileId"],
	[AUDIT_ACTIONS.CSE_OPINION_UPLOAD_FILE]: ["fileId", "flowType", "s3Cleanup"],
	[AUDIT_ACTIONS.JOINT_EVALUATION_UPLOAD_FILE]: [
		"fileId",
		"flowType",
		"s3Cleanup",
	],
	[AUDIT_ACTIONS.USER_FILE_DOWNLOAD]: ["fileId"],
	[AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD]: ["fileId"],
	[AUDIT_ACTIONS.NOTIFICATION_ENQUEUE]: [
		"type",
		"kind",
		"year",
		"isResend",
		"variant",
		"attachmentsDropped",
	],
};

function validIsoDate(value: unknown): string | undefined {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		return undefined;
	const parsed = new Date(value);
	return Number.isFinite(parsed.getTime()) &&
		parsed.toISOString().slice(0, 10) === value &&
		parsed.getUTCFullYear() >= 2000 &&
		parsed.getUTCFullYear() <= 2100
		? value
		: undefined;
}

function validValue(
	field: MetadataField,
	value: unknown,
): string | number | boolean | number[] | string[] | null | undefined {
	switch (field) {
		case "year": {
			const year =
				typeof value === "string" && /^\d{4}$/.test(value)
					? Number(value)
					: value;
			return typeof year === "number" &&
				Number.isInteger(year) &&
				year >= 2000 &&
				year <= 2100
				? year
				: undefined;
		}
		case "years":
			return Array.isArray(value) &&
				value.length >= 1 &&
				value.length <= 5 &&
				value.every(
					(year) =>
						typeof year === "number" &&
						Number.isInteger(year) &&
						year >= 2000 &&
						year <= 2100,
				)
				? [...value]
				: undefined;
		case "count":
		case "limit":
		case "timeoutMinutes":
			return typeof value === "number" &&
				Number.isSafeInteger(value) &&
				value >= 0 &&
				value <= 1000000
				? value
				: undefined;
		case "format":
			return value === "json" || value === "csv" || value === "xlsx"
				? value
				: undefined;
		case "hasCse":
		case "publicAgentRequired":
			return typeof value === "boolean" ? value : undefined;
		case "roles":
			return value === null
				? null
				: Array.isArray(value) &&
						value.length <= 20 &&
						value.every((role) => typeof role === "string")
					? value.includes("agent_public")
						? ["agent_public"]
						: []
					: undefined;
		case "campaignStartDate":
		case "publicDataReleaseDate":
			return value === null || value === "" ? null : validIsoDate(value);
		case "campaignEndDate":
		case "declarationDeadline":
		case "decl1ModificationDeadline":
		case "decl1JustificationDeadline":
		case "decl1JointEvaluationDeadline":
		case "decl2ModificationDeadline":
		case "decl2JustificationDeadline":
		case "decl2JointEvaluationDeadline":
		case "decl2CseOpinionDeadline":
			return validIsoDate(value);
		case "id":
		case "declarationId":
		case "fileId":
			return typeof value === "string" && UUID_PATTERN.test(value)
				? value
				: undefined;
		case "siren": {
			if (typeof value !== "string") return undefined;
			// Match sirenSchema's accepted display form, then store the canonical ID.
			const siren = value.replace(/\s/g, "");
			return /^\d{9}$/.test(siren) ? siren : undefined;
		}
		case "flowType":
			return value === "cse_opinion" || value === "joint_evaluation"
				? value
				: undefined;
		case "s3Cleanup":
			return value === "ok" || value === "failed" ? value : undefined;
		case "reason":
			return value === "siret_changed" ||
				value === "siret_missing" ||
				value === "company_link_revoked"
				? value
				: undefined;
		case "date_begin":
		case "date_end":
			return validIsoDate(value);
		case "invalidYear":
		case "testSeam":
		case "isResend":
		case "attachmentsDropped":
			return typeof value === "boolean" ? value : undefined;
		case "type":
			return typeof value === "string" && RECEIPT_TYPES.has(value)
				? value
				: undefined;
		case "kind":
			return typeof value === "string" && RECEIPT_KINDS.has(value)
				? value
				: undefined;
		case "variant":
			return typeof value === "string" && RECEIPT_VARIANTS.has(value)
				? value
				: undefined;
		case "acr":
			return value === "eidas1" ||
				value === "eidas1-mfa" ||
				value === "eidas2" ||
				value === "eidas3"
				? value
				: undefined;
		case "authTime":
			return typeof value === "number" &&
				Number.isSafeInteger(value) &&
				value >= 0 &&
				value <= 4102444800
				? value
				: undefined;
	}
}

export function projectAuditMetadata(
	action: AuditActionKey,
	value: unknown,
): AuditMetadata | null {
	if (
		typeof value !== "object" ||
		value === null ||
		Array.isArray(value) ||
		value instanceof Date
	)
		return null;
	const fields = FIELDS_BY_ACTION[action];
	if (!fields) return null;
	try {
		const source = value as Record<string, unknown>;
		const result: AuditMetadata = {};
		for (const field of fields) {
			const valid = validValue(field, source[field]);
			if (valid !== undefined) result[field] = valid;
		}
		return Object.keys(result).length > 0 ? result : null;
	} catch {
		// A caller-supplied object with a throwing getter must not disrupt the
		// request or the audit row.
		return null;
	}
}
