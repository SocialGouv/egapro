// Matomo event taxonomy. Single source of truth — keep in sync with
// `docs/plan-de-tracking.md` and `docs/strategie-tracking.md`.

export const MATOMO_EVENT_CATEGORY = {
	DECLARATION: "declaration",
	CSE_OPINION: "cse_opinion",
	COMPLIANCE_PATH: "compliance_path",
	SEARCH: "search",
	HELP: "help",
	DOCUMENT: "document",
	AUTH: "auth",
	DASHBOARD: "dashboard",
	CSE_STATUS: "cse_status",
} as const;

export const MATOMO_FUNNEL_ACTION = {
	FUNNEL_START: "funnel_start",
	STEP_COMPLETE: "step_complete",
	FUNNEL_COMPLETE: "funnel_complete",
	FUNNEL_ABANDON: "funnel_abandon",
} as const;

export const MATOMO_ACTION = {
	SEARCH_SUBMIT: "search_submit",
	CONSULTATION_OUTBOUND: "consultation_outbound",
	FAQ_SECTION_OPEN: "faq_section_open",
	AIDE_RESOURCE_CLICK: "aide_resource_click",
	PDF_DOWNLOAD: "pdf_download",
	FILE_UPLOAD: "file_upload",
	LOGIN_START: "login_start",
	DECLARATION_START: "declaration_start",
	CATEGORY_IMPORT: "category_import",
	CATEGORY_IMPORT_FAILURE: "category_import_failure",
	CATEGORY_IMPORT_DURATION: "category_import_duration",
	CATEGORY_TEMPLATE_DOWNLOAD: "category_template_download",
	HELP_LINK_CLICK: "help_link_click",
	CSE_STATUS_CONFIRM: "cse_status_confirm",
} as const;

// Slot IDs must match the Custom Dimension slots configured in the Matomo
// admin; a wrong ID makes the dimension silently ignored.
export const MATOMO_CUSTOM_DIMENSION = {
	CAMPAIGN_YEAR: 1,
	WORKFORCE_RANGE: 2,
} as const;

export function buildFunnelStepKeys(lastStep: number): readonly string[] {
	return Array.from({ length: lastStep + 1 }, (_, index) => `step_${index}`);
}

export function campaignYearDimension(year: number): Record<number, string> {
	return { [MATOMO_CUSTOM_DIMENSION.CAMPAIGN_YEAR]: String(year) };
}

// Declare one constant per funnel at module scope so the reference stays stable
// across renders (it is an effect dependency of `useFunnelTracking`).
export type FunnelConfig = {
	category: string;
	stepKeys: readonly string[];
	// Unique `sessionStorage` key — two funnels must never share one.
	storageKey: string;
	firstStep?: number;
	lastStep?: number;
};

export type MatomoEvent = {
	category: string;
	action: string;
	name?: string;
	value?: number;
	dimensions?: Record<number, string>;
};
