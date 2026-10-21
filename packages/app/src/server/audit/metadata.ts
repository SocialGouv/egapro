import type { AuditActionKey, AuditMetadata } from "~/modules/audit";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { isUploadFlowType } from "~/modules/shared/uploadConfig";

type MetadataField =
	| "year"
	| "years"
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
	| "virusName"
	| "roles"
	| "granted"
	| "publicAgentRequired"
	| "reason";

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CLAMAV_SIGNATURE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:+/@-]{0,254}$/;

const RECEIPT_TYPES = new Set([
	"declaration_confirmation",
	"second_declaration_confirmation",
	"cse_opinion_receipt",
	"joint_evaluation_submitted",
	"formal_notice_joint_evaluation_submitted",
	"representation_receipt",
]);
const RECEIPT_KINDS = new Set([
	"declaration",
	"secondDeclaration",
	"cseOpinion",
	"jointEvaluation",
	"formalNoticeJointEvaluation",
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
	[AUDIT_ACTIONS.PDF_JOINT_EVALUATION_DOWNLOAD]: ["year"],
	[AUDIT_ACTIONS.EXPORT_GENERATE]: ["year"],
	[AUDIT_ACTIONS.EXPORT_DOWNLOAD]: ["year"],
	[AUDIT_ACTIONS.EXPORT_API_DECLARATIONS]: ["year", "date_begin", "date_end"],
	[AUDIT_ACTIONS.EXPORT_API_REPRESENTATIONS]: [
		"year",
		"date_begin",
		"date_end",
	],
	[AUDIT_ACTIONS.EXPORT_API_FILES]: ["year", "fileId"],
	[AUDIT_ACTIONS.PUBLIC_DECLARATIONS_EXPORT]: ["format"],
	[AUDIT_ACTIONS.PUBLIC_REFERENT_SEARCH]: ["format"],
	[AUDIT_ACTIONS.AUTH_ADMIN_MFA]: [
		"acr",
		"authTime",
		"testSeam",
		"roles",
		"granted",
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
	[AUDIT_ACTIONS.CSE_OPINION_UPLOAD_FILE]: [
		"fileId",
		"flowType",
		"s3Cleanup",
		"virusName",
	],
	[AUDIT_ACTIONS.JOINT_EVALUATION_UPLOAD_FILE]: [
		"fileId",
		"flowType",
		"s3Cleanup",
		"virusName",
	],
	[AUDIT_ACTIONS.FORMAL_NOTICE_JOINT_EVALUATION_UPLOAD_FILE]: [
		"fileId",
		"flowType",
		"s3Cleanup",
		"virusName",
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

type MetadataValue = string | number | boolean | number[] | string[] | null;
type Validator = (value: unknown) => MetadataValue | undefined;

function isYear(value: unknown): value is number {
	return (
		typeof value === "number" &&
		Number.isInteger(value) &&
		value >= 2000 &&
		value <= 2100
	);
}

function boundedInteger(max: number): Validator {
	return (value) =>
		typeof value === "number" &&
		Number.isSafeInteger(value) &&
		value >= 0 &&
		value <= max
			? value
			: undefined;
}

function oneOf(allowed: ReadonlySet<string>): Validator {
	return (value) =>
		typeof value === "string" && allowed.has(value) ? value : undefined;
}

function matching(pattern: RegExp): Validator {
	return (value) =>
		typeof value === "string" && pattern.test(value) ? value : undefined;
}

const validBoolean: Validator = (value) =>
	typeof value === "boolean" ? value : undefined;

const validOptionalIsoDate: Validator = (value) =>
	value === null || value === "" ? null : validIsoDate(value);

function validYear(value: unknown): number | undefined {
	const year =
		typeof value === "string" && /^\d{4}$/.test(value) ? Number(value) : value;
	return isYear(year) ? year : undefined;
}

function validYears(value: unknown): number[] | undefined {
	return Array.isArray(value) &&
		value.length >= 1 &&
		value.length <= 5 &&
		value.every(isYear)
		? [...value]
		: undefined;
}

function validRoles(value: unknown): string[] | null | undefined {
	if (value === null) return null;
	if (
		!Array.isArray(value) ||
		value.length > 20 ||
		!value.every((role) => typeof role === "string")
	)
		return undefined;
	return value.includes("agent_public") ? ["agent_public"] : [];
}

function validSiren(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	// Match sirenSchema's accepted display form, then store the canonical ID.
	const siren = value.replace(/\s/g, "");
	return /^\d{9}$/.test(siren) ? siren : undefined;
}

const validUuid = matching(UUID_PATTERN);
const validCount = boundedInteger(1000000);

const VALIDATORS: Record<MetadataField, Validator> = {
	year: validYear,
	years: validYears,
	timeoutMinutes: validCount,
	format: oneOf(new Set(["json", "csv", "xlsx"])),
	hasCse: validBoolean,
	publicAgentRequired: validBoolean,
	granted: validBoolean,
	roles: validRoles,
	campaignStartDate: validOptionalIsoDate,
	publicDataReleaseDate: validOptionalIsoDate,
	campaignEndDate: validIsoDate,
	declarationDeadline: validIsoDate,
	decl1ModificationDeadline: validIsoDate,
	decl1JustificationDeadline: validIsoDate,
	decl1JointEvaluationDeadline: validIsoDate,
	decl2ModificationDeadline: validIsoDate,
	decl2JustificationDeadline: validIsoDate,
	decl2JointEvaluationDeadline: validIsoDate,
	decl2CseOpinionDeadline: validIsoDate,
	id: validUuid,
	declarationId: validUuid,
	fileId: validUuid,
	siren: validSiren,
	flowType: (value) => (isUploadFlowType(value) ? value : undefined),
	s3Cleanup: oneOf(new Set(["ok", "failed"])),
	virusName: matching(CLAMAV_SIGNATURE_PATTERN),
	reason: oneOf(
		new Set(["siret_changed", "siret_missing", "company_link_revoked"]),
	),
	date_begin: validIsoDate,
	date_end: validIsoDate,
	invalidYear: validBoolean,
	testSeam: validBoolean,
	isResend: validBoolean,
	attachmentsDropped: validBoolean,
	type: oneOf(RECEIPT_TYPES),
	kind: oneOf(RECEIPT_KINDS),
	variant: oneOf(RECEIPT_VARIANTS),
	acr: oneOf(new Set(["eidas1", "eidas1-mfa", "eidas2", "eidas3"])),
	authTime: boundedInteger(4102444800),
};

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
			const valid = VALIDATORS[field](source[field]);
			if (valid !== undefined) result[field] = valid;
		}
		return Object.keys(result).length > 0 ? result : null;
	} catch {
		// A caller-supplied object with a throwing getter must not disrupt the
		// request or the audit row.
		return null;
	}
}
