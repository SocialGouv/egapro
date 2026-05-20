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
// Declaration display context
export type { DeclarationDisplayContext } from "./shared/declarationDisplay";
export { getDeclarationDisplayContext } from "./shared/declarationDisplay";
// Declaration derived flags (phase 2, revision, indicator G)
export type {
	DeclarationForFlags,
	Phase2RequiredInput,
	Phase2RevisionRequiredInput,
} from "./shared/declarationFlags";
export {
	isPhase2Required,
	isPhase2RevisionRequired,
} from "./shared/declarationFlags";
// Declaration prerequisites
export { hasRequiredDeclarationInfo } from "./shared/declarationPrerequisites";
// Declaration process step deadline
export { getDeclarationProcessStepDeadline } from "./shared/declarationProcessStep";
// Declaration status
export {
	computeDeclarationStatus,
	getCurrentCompliancePath,
	isCancelled,
} from "./shared/declarationStatus";
// Declaration steps labels (A–F stepper)
export type { DeclarationStepNumber } from "./shared/declarationSteps";
export { DECLARATION_STEPS, getStepLabel } from "./shared/declarationSteps";
// Declaration status history (event-sourced trajectory)
export type {
	DeclarationEventType,
	DeclarationStatusEvent,
	TrajectoryEntry,
} from "./shared/declarationTrajectory";
export {
	findLastEvent,
	getCseOpinionCompletedAt,
	getDeclarationTrajectory,
	getDemarcheCompletedAt,
	getEventTimestamp,
	getJointEvaluationSubmittedAt,
	getPathChoiceAt,
	getSecondDeclarationSubmittedAt,
	getSubmittedAt,
	hasEvent,
	hasSubmittedSecondDeclaration,
} from "./shared/declarationTrajectory";
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
// Indicator G — applicability rules (workforce thresholds, triennial cycle, universal year)
export {
	getApplicableIndicators,
	INDICATOR_G_ANNUAL_MIN,
	INDICATOR_G_TRIENNIAL_BASE_YEAR,
	INDICATOR_G_TRIENNIAL_MIN,
	INDICATOR_G_UNIVERSAL_YEAR,
	isIndicatorGRequired,
	isTriennialYear,
} from "./shared/indicatorG";
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
	DeclarationFsmStatus,
	DeclarationStatus,
	DeclarationType,
	GapLevel,
} from "./types";
