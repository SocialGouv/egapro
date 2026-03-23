// Regulatory thresholds
/** Gap percentage that triggers an alert and compliance obligations. */
export const GAP_ALERT_THRESHOLD = 5;

/** Workforce below this: voluntary declaration only. */
export const COMPANY_SIZE_VOLUNTARY_MAX = 50;

/** Workforce at or above this: annual declaration + CSE opinion required. */
export const COMPANY_SIZE_ANNUAL_MIN = 100;

// Campaign
/** Year for which companies must declare their indicators. */
export const DECLARATION_YEAR = 2025;

/** Deadline date for the current declaration campaign. */
export const DECLARATION_DEADLINE = "1er mars 2026";

// Declaration types expected each year
/** Every company must file these two declaration types annually. */
export const EXPECTED_DECLARATION_TYPES = [
	"remuneration",
	"representation",
] as const;

// Limits
/** Maximum number of CSE opinion files per company per year. */
export const MAX_CSE_FILES = 4;
