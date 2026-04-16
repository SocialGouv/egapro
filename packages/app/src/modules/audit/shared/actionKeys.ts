import type { AuditCategory } from "../types";

/**
 * Centralised registry of every auditable action key.
 *
 * Adding a new audit point ⇒ add a constant here, never inline a string.
 * The string value is what ends up in `audit.action_log.action`, so keep it
 * stable: SQL queries depend on it.
 */
export const AUDIT_ACTIONS = {
	// ── Auth ────────────────────────────────────────────────
	AUTH_LOGIN: "auth.login",
	AUTH_LOGIN_FAILED: "auth.login_failed",
	AUTH_LOGOUT: "auth.logout",

	// ── Declaration mutations ──────────────────────────────
	DECLARATION_CREATE: "declaration.create",
	DECLARATION_UPDATE_STEP_1: "declaration.update_step_1",
	DECLARATION_UPDATE_STEP_2: "declaration.update_step_2",
	DECLARATION_UPDATE_STEP_3: "declaration.update_step_3",
	DECLARATION_UPDATE_STEP_4: "declaration.update_step_4",
	DECLARATION_UPDATE_EMPLOYEE_CATEGORIES:
		"declaration.update_employee_categories",
	DECLARATION_SUBMIT: "declaration.submit",
	DECLARATION_SUBMIT_SECOND: "declaration.submit_second",
	DECLARATION_SAVE_COMPLIANCE_PATH: "declaration.save_compliance_path",
	DECLARATION_COMPLETE_COMPLIANCE_PATH: "declaration.complete_compliance_path",

	// ── CSE opinion mutations ──────────────────────────────
	CSE_OPINION_SAVE: "cse_opinion.save",
	CSE_OPINION_UPLOAD_FILE: "cse_opinion.upload_file",
	CSE_OPINION_DELETE_FILE: "cse_opinion.delete_file",

	// ── Joint evaluation mutations ─────────────────────────
	JOINT_EVALUATION_UPLOAD_FILE: "joint_evaluation.upload_file",

	// ── Company mutations ──────────────────────────────────
	COMPANY_UPDATE_HAS_CSE: "company.update_has_cse",

	// ── Profile mutations ──────────────────────────────────
	PROFILE_UPDATE_PHONE: "profile.update_phone",

	// ── GIP MDS ────────────────────────────────────────────
	GIP_MDS_IMPORT: "gip_mds.import",

	// ── Admin reads ───────────────────────────────────────
	ADMIN_DECLARATIONS_SEARCH: "admin_declarations.search",
	ADMIN_DECLARATION_GET_BY_ID: "admin_declarations.get_by_id",

	// ── Admin settings mutations ──────────────────────────
	ADMIN_SETTINGS_UPSERT_DEADLINES: "admin_settings.upsert_deadlines",
	ADMIN_SETTINGS_SET_ACTIVE_YEAR: "admin_settings.set_active_year",

	// ── Sensitive reads ────────────────────────────────────
	ADMIN_FILE_DOWNLOAD: "admin.file_download",
	PROFILE_READ: "profile.read",
	DECLARATION_READ_GIP_DATA: "declaration.read_gip_data",
	PDF_DECLARATION_DOWNLOAD: "pdf.declaration_download",
	PDF_TRANSMITTED_DOWNLOAD: "pdf.transmitted_download",
	PDF_NO_SANCTION_DOWNLOAD: "pdf.no_sanction_download",
	USER_FILE_DOWNLOAD: "user.file_download",

	// ── Exports & external API consumers ──────────────────
	EXPORT_DOWNLOAD: "export.download",
	EXPORT_GENERATE: "export.generate",
	EXPORT_API_DECLARATIONS: "export.api_declarations",
	EXPORT_API_FILES: "export.api_files",

	// ── Mail ───────────────────────────────────────────────
	MAIL_RECEIPT_SEND: "mail.receipt_send",
	MAIL_RECEIPT_RESEND: "mail.receipt_resend",

	// ── Public searches ────────────────────────────────────
	PUBLIC_REFERENT_SEARCH: "public_referents.search",
	PUBLIC_REFERENT_VIEW: "public_referents.view",

	// ── System / cron-triggered ────────────────────────────
	SYSTEM_AUDIT_CLEANUP: "system.audit_cleanup",
} as const;

export type AuditActionKey = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Static category mapping per action — single source of truth, used by both
 * the tRPC middleware and the route handler wrapper to attach the correct
 * category at log time without callers having to repeat themselves.
 */
export const AUDIT_ACTION_CATEGORIES: Record<AuditActionKey, AuditCategory> = {
	[AUDIT_ACTIONS.AUTH_LOGIN]: "auth",
	[AUDIT_ACTIONS.AUTH_LOGIN_FAILED]: "auth",
	[AUDIT_ACTIONS.AUTH_LOGOUT]: "auth",

	[AUDIT_ACTIONS.DECLARATION_CREATE]: "mutation",
	[AUDIT_ACTIONS.DECLARATION_UPDATE_STEP_1]: "mutation",
	[AUDIT_ACTIONS.DECLARATION_UPDATE_STEP_2]: "mutation",
	[AUDIT_ACTIONS.DECLARATION_UPDATE_STEP_3]: "mutation",
	[AUDIT_ACTIONS.DECLARATION_UPDATE_STEP_4]: "mutation",
	[AUDIT_ACTIONS.DECLARATION_UPDATE_EMPLOYEE_CATEGORIES]: "mutation",
	[AUDIT_ACTIONS.DECLARATION_SUBMIT]: "mutation",
	[AUDIT_ACTIONS.DECLARATION_SUBMIT_SECOND]: "mutation",
	[AUDIT_ACTIONS.DECLARATION_SAVE_COMPLIANCE_PATH]: "mutation",
	[AUDIT_ACTIONS.DECLARATION_COMPLETE_COMPLIANCE_PATH]: "mutation",

	[AUDIT_ACTIONS.CSE_OPINION_SAVE]: "mutation",
	[AUDIT_ACTIONS.CSE_OPINION_UPLOAD_FILE]: "mutation",
	[AUDIT_ACTIONS.CSE_OPINION_DELETE_FILE]: "mutation",

	[AUDIT_ACTIONS.JOINT_EVALUATION_UPLOAD_FILE]: "mutation",

	[AUDIT_ACTIONS.COMPANY_UPDATE_HAS_CSE]: "mutation",

	[AUDIT_ACTIONS.PROFILE_UPDATE_PHONE]: "mutation",

	[AUDIT_ACTIONS.GIP_MDS_IMPORT]: "system",

	[AUDIT_ACTIONS.ADMIN_DECLARATIONS_SEARCH]: "read_sensitive",
	[AUDIT_ACTIONS.ADMIN_DECLARATION_GET_BY_ID]: "read_sensitive",
	[AUDIT_ACTIONS.ADMIN_SETTINGS_UPSERT_DEADLINES]: "mutation",
	[AUDIT_ACTIONS.ADMIN_SETTINGS_SET_ACTIVE_YEAR]: "mutation",
	[AUDIT_ACTIONS.ADMIN_FILE_DOWNLOAD]: "read_sensitive",
	[AUDIT_ACTIONS.PROFILE_READ]: "read_sensitive",
	[AUDIT_ACTIONS.DECLARATION_READ_GIP_DATA]: "read_sensitive",
	[AUDIT_ACTIONS.PDF_DECLARATION_DOWNLOAD]: "read_sensitive",
	[AUDIT_ACTIONS.PDF_TRANSMITTED_DOWNLOAD]: "read_sensitive",
	[AUDIT_ACTIONS.PDF_NO_SANCTION_DOWNLOAD]: "read_sensitive",
	[AUDIT_ACTIONS.USER_FILE_DOWNLOAD]: "read_sensitive",

	[AUDIT_ACTIONS.EXPORT_DOWNLOAD]: "export",
	[AUDIT_ACTIONS.EXPORT_GENERATE]: "export",
	[AUDIT_ACTIONS.EXPORT_API_DECLARATIONS]: "export",
	[AUDIT_ACTIONS.EXPORT_API_FILES]: "export",

	[AUDIT_ACTIONS.MAIL_RECEIPT_SEND]: "mutation",
	[AUDIT_ACTIONS.MAIL_RECEIPT_RESEND]: "mutation",

	[AUDIT_ACTIONS.PUBLIC_REFERENT_SEARCH]: "public_search",
	[AUDIT_ACTIONS.PUBLIC_REFERENT_VIEW]: "public_search",

	[AUDIT_ACTIONS.SYSTEM_AUDIT_CLEANUP]: "system",
};
