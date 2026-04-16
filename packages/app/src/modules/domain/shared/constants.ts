// Regulatory thresholds
/** Gap percentage that triggers an alert and compliance obligations. */
export const GAP_ALERT_THRESHOLD = 5;

/** Workforce below this: voluntary declaration only. */
export const COMPANY_SIZE_VOLUNTARY_MAX = 50;

/** Workforce at or above this: annual declaration + CSE opinion required. */
export const COMPANY_SIZE_ANNUAL_MIN = 100;

/**
 * Anchor year for the triennial declaration cycle (workforce 50-99).
 *
 * Companies in this size range declare in the anchor year and every third
 * year thereafter: 2030, 2033, 2036, …
 */
export const TRIENNIAL_ANCHOR_YEAR = 2030;

/** Periodicity (in years) of the triennial declaration cycle. */
export const TRIENNIAL_CYCLE = 3;

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

/** First year the Egapro platform started collecting declarations. */
export const FIRST_DECLARATION_YEAR = 2018;
