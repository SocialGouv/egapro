// Regulatory thresholds
/** Gap percentage that triggers an alert and compliance obligations. */
export const GAP_ALERT_THRESHOLD = 5;

/** Number of decimal places used when displaying a gap percentage to the user. */
export const GAP_DISPLAY_DECIMALS = 2;

/** Workforce below this: voluntary declaration only. */
export const COMPANY_SIZE_VOLUNTARY_MAX = 50;

/** Workforce at or above this: CSE opinion + gap-alert obligations. Every mandatory tier (>= 50) declares annually since the 2026-07 business arbitrage, so this threshold marks the compliance-obligation package, not the annual cadence. */
export const COMPANY_SIZE_ANNUAL_MIN = 100;

/** First campaign year of the V2 scheme (7-indicator regime). The 50-99 annual declaration obligation starts here; earlier years keep their historical behavior. */
export const V2_FIRST_CAMPAIGN_YEAR = 2027;

// Declaration types expected each year
/** Every company must file these two declaration types annually. */
export const EXPECTED_DECLARATION_TYPES = [
	"remuneration",
	"representation",
] as const;

// Limits
/** Maximum number of CSE opinion files per company per year. */
export const MAX_CSE_FILES = 4;

/** First year the Egapro platform started collecting declarations. */
export const FIRST_DECLARATION_YEAR = 2018;

// Quartile thresholds
/** Number of quartiles in the pay gap table. */
export const QUARTILE_COUNT = 4;

/** Number of user-entered thresholds (Q4 has no upper threshold). */
export const QUARTILE_THRESHOLD_COUNT = 3;

/** Minimum increment in € applied to the previous threshold to compute the next quartile's lower bound. */
export const QUARTILE_MIN_INCREMENT = 0.01;
