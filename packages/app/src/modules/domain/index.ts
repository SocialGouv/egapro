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
	companySizeRangeSchema,
	isCseRequired,
	isObligatedForYear,
} from "./shared/companySize";
// Constants
export {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	EXPECTED_DECLARATION_TYPES,
	FIRST_DECLARATION_YEAR,
	GAP_ALERT_THRESHOLD,
	MAX_CSE_FILES,
	TRIENNIAL_ANCHOR_YEAR,
	TRIENNIAL_CYCLE,
} from "./shared/constants";
// Declaration prerequisites
export { hasRequiredDeclarationInfo } from "./shared/declarationPrerequisites";
// Declaration status
export { computeDeclarationStatus } from "./shared/declarationStatus";
// Display formatting (%, €, units)
export {
	computePercentage,
	computeProportion,
	formatCount,
	formatCurrency,
	formatGap,
	formatGapCompact,
	formatLongDate,
	formatPointsDelta,
	formatShortDate,
	formatShortDateTime,
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
