// Types

// Campaign
export { getCseYear, getCurrentYear } from "./shared/campaign";
// Company size
export { classifyCompanySize, isCseRequired } from "./shared/companySize";
// Constants
export {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	DECLARATION_DEADLINE,
	DECLARATION_YEAR,
	EXPECTED_DECLARATION_TYPES,
	GAP_ALERT_THRESHOLD,
	MAX_CSE_FILES,
} from "./shared/constants";
// Declaration status
export { computeDeclarationStatus } from "./shared/declarationStatus";
// Gap calculations
export {
	computeGap,
	computePercentage,
	computeProportion,
	computeTotal,
	displayDecimal,
	formatCurrency,
	formatGap,
	formatGapCompact,
	formatTotal,
	gapLevel,
	hasGapsAboveThreshold,
	normalizeDecimalInput,
	parseNumber,
} from "./shared/gap";
// SIREN utilities
export { extractSiren, formatSiren, parseSiren } from "./shared/siren";
export type {
	CompanySize,
	CompliancePath,
	DeclarationStatus,
	DeclarationType,
	GapLevel,
} from "./types";
