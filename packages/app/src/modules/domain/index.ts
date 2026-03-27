// Types

// Campaign
export {
	getCseYear,
	getCurrentYear,
	getDeclarationDeadline,
	getSecondDeclarationDeadline,
} from "./shared/campaign";
// Company size
export { classifyCompanySize, isCseRequired } from "./shared/companySize";
// Constants
export {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	DECLARATION_DEADLINE,
	DECLARATION_YEAR,
	EXPECTED_DECLARATION_TYPES,
	FIRST_DECLARATION_YEAR,
	GAP_ALERT_THRESHOLD,
	MAX_CSE_FILES,
} from "./shared/constants";
// Declaration status
export { computeDeclarationStatus } from "./shared/declarationStatus";
// Display formatting (%, €, units)
export {
	computePercentage,
	computeProportion,
	formatCurrency,
	formatGap,
	formatGapCompact,
	formatLongDate,
	formatTotal,
} from "./shared/format";
// Gap business rules (calculations & threshold classification)
export {
	computeGap,
	computeTotal,
	gapLevel,
	hasGapsAboveThreshold,
} from "./shared/gap";
// Number parsing & normalization (French locale)
export {
	displayDecimal,
	displayInputDecimal,
	normalizeDecimalInput,
	parseNumber,
} from "./shared/number";
// SIREN utilities
export { extractSiren, formatSiren, parseSiren } from "./shared/siren";
export type {
	CompanySize,
	DeclarationStatus,
	DeclarationType,
	GapLevel,
} from "./types";
