// Types

// Campaign
export {
	getCurrentYear,
	getDeclarationDeadline,
	getDefaultCampaignDeadlines,
	getSecondDeclarationDeadline,
	getWorkforceYear,
	isDeadlinePassed,
	shouldRedirectSubmittedToRecap,
} from "./shared/campaign";
// Company size
export {
	COMPANY_SIZE_RANGES,
	classifyCompanySize,
	isCseRequired,
} from "./shared/companySize";
// Constants
export {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	EXPECTED_DECLARATION_TYPES,
	FIRST_DECLARATION_YEAR,
	GAP_ALERT_THRESHOLD,
	MAX_CSE_FILES,
	QUARTILE_COUNT,
	QUARTILE_MIN_INCREMENT,
	QUARTILE_THRESHOLD_COUNT,
} from "./shared/constants";
// Declaration prerequisites
export { hasRequiredDeclarationInfo } from "./shared/declarationPrerequisites";
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
	formatMonthDay,
	formatShortDate,
	formatShortDateTime,
	formatTotal,
} from "./shared/format";
// Gap business rules (calculations & threshold classification)
export {
	computeGap,
	computeGapRatio,
	computeTotal,
	gapLevel,
	hasGapsAboveThreshold,
} from "./shared/gap";
// Number parsing & normalization (French locale)
export {
	displayDecimal,
	displayInputDecimal,
	normalizeDecimalInput,
	padDecimalOnBlur,
	padDecimalToTwo,
	parseNumber,
} from "./shared/number";
// Quartile helpers
export { computeQuartileMin, migrateLegacyThresholds } from "./shared/quartile";
export type { CountyCode, RegionCode } from "./shared/regions";
// Regions & counties
export {
	COUNTIES,
	COUNTY_CODES,
	REGION_CODES,
	REGIONS,
	REGIONS_TO_COUNTIES,
} from "./shared/regions";
// SIREN utilities
export { extractSiren, formatSiren, parseSiren } from "./shared/siren";
export type {
	CampaignDeadlines,
	CompanySize,
	CompanySizeRange,
	DeclarationStatus,
	DeclarationType,
	GapLevel,
} from "./types";
