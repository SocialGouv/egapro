// Regulatory thresholds
/** Gap percentage that triggers an alert and compliance obligations. */
export const GAP_ALERT_THRESHOLD = 5;

/** Workforce below this: voluntary declaration only. */
export const COMPANY_SIZE_VOLUNTARY_MAX = 50;

/** Workforce at or above this: annual declaration + CSE opinion required. */
export const COMPANY_SIZE_ANNUAL_MIN = 100;

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
