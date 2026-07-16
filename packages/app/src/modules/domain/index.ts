// Types

// Campaign
export {
	formatIsoDateToFrench,
	getCurrentYear,
	getDeclarationDeadline,
	getDefaultCampaignDeadlines,
	getPathChoiceDeadline,
	getReferencePeriod,
	getRepresentationDeadline,
	getSecondDeclarationDeadline,
	getWorkforceYear,
	getWorkforceYearFor,
	isDeadlinePassed,
	resolveGipReferencePeriod,
	shouldRedirectSubmittedToRecap,
} from "./shared/campaign";
// Company obligation
export { isObligatedForYear } from "./shared/companyObligation";
// Company size
export {
	COMPANY_SIZE_RANGES,
	classifyCompanySize,
	getCompanySizeRange,
	isCseRequired,
} from "./shared/companySize";
// Global score computation (sum of sub-scores from the EgaPro index)
export type { GlobalScoreInputs } from "./shared/computeGlobalScore";
export { computeGlobalScore } from "./shared/computeGlobalScore";
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
// Declaration derived flags (compliance process, revision, indicator G)
export type {
	ComplianceProcessRequiredInput,
	ComplianceProcessRevisionRequiredInput,
	DeclarationForFlags,
} from "./shared/declarationFlags";
export {
	isComplianceProcessRequired,
	isComplianceProcessRevisionRequired,
} from "./shared/declarationFlags";
// Declaration edit lock constants
export {
	DEFAULT_LOCK_TIMEOUT_MINUTES,
	LOCK_HEARTBEAT_INTERVAL_MS,
} from "./shared/declarationLock";
// Declaration prerequisites
export { hasRequiredDeclarationInfo } from "./shared/declarationPrerequisites";
// Declaration process step deadline
export { getDeclarationProcessStepDeadline } from "./shared/declarationProcessStep";
// Declaration status
export {
	computeDeclarationStatus,
	getCurrentCompliancePath,
	hasStartedSecondDeclaration,
	isCancelled,
	isComplianceProcessCompleted,
	isDeclarationSubmitted,
	isDraft,
	isInComplianceProcess,
} from "./shared/declarationStatus";
// Declaration steps labels (A–F stepper), post-submit milestones, K19 funnels
export type {
	DeclarationStepNumber,
	FunnelComplianceStepKey,
	FunnelCseStepKey,
	FunnelMainStepKey,
	FunnelRevisionStepKey,
	PostSubmitDropoffPhaseKey,
	PostSubmitMilestoneKey,
} from "./shared/declarationSteps";
export {
	DECLARATION_STEPS,
	DROPOFF_RATE_ALERT_THRESHOLD,
	DROPOFF_STAGNATION_DAYS_DEFAULT,
	DROPOFF_STAGNATION_DAYS_MAX,
	DROPOFF_STAGNATION_DAYS_MIN,
	FUNNEL_COMPLIANCE_KEY_STEPS,
	FUNNEL_CSE_KEY_STEPS,
	FUNNEL_DROP_ALERT_THRESHOLD,
	FUNNEL_MAIN_KEY_STEPS,
	FUNNEL_REVISION_KEY_STEPS,
	getStepLabel,
	POST_SUBMIT_DROPOFF_PHASES,
	POST_SUBMIT_MILESTONES,
} from "./shared/declarationSteps";
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
	computeGapBetween,
	computeGapRatio,
	computeTotal,
	gapDirection,
	gapLevel,
	gapMagnitude,
	gapRatioToPercent,
	hasGapsAboveThreshold,
	hasHighGap,
	isSignificantGap,
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
// Percentage & proportion numeric cores
export { percentageOf, proportionOf } from "./shared/percentage";
// Public data release gate
export { isYearPubliclyReleased } from "./shared/publicData";
// Quartile helpers
export {
	computeQuartileMin,
	isQuartileImbalanced,
	migrateLegacyThresholds,
	quartileImbalanceDirection,
} from "./shared/quartile";
export type {
	CompanyLocation,
	CountyCode,
	RegionCode,
} from "./shared/regions";
// Regions & counties
export {
	COUNTIES,
	COUNTY_CODES,
	COUNTY_TO_REGION,
	getCountyCodeFromPostalCode,
	getLocationFromPostalCode,
	getRegionCodeFromCountyCode,
	REGION_CODES,
	REGIONS,
	REGIONS_TO_COUNTIES,
} from "./shared/regions";
// Score brackets for public stats distribution chart
export type { ScoreBracket, ScoreBracketId } from "./shared/scoreBracket";
export { getScoreBracket, SCORE_BRACKETS } from "./shared/scoreBracket";
// SIREN utilities
export { extractSiren, formatSiren, parseSiren } from "./shared/siren";
// Submission rate helpers (shared by admin/public stats routers and KPI tiles)
export type { CampaignRateTileProps } from "./shared/submissionRate";
export {
	buildCampaignRateTileProps,
	computeRate,
	formatCount,
	formatPointsAbs,
	formatRate,
	NARROW_NBSP,
	roundOneDecimal,
} from "./shared/submissionRate";
// Workforce sums (quartiles, categories)
export {
	computeWorkforceTotal,
	sumCategoryWorkforce,
	sumQuartileWorkforce,
} from "./shared/workforce";
export type {
	CampaignDeadlines,
	CompanySize,
	CompanySizeRange,
	DeclarationFsmStatus,
	DeclarationStatus,
	DeclarationType,
	GapDirection,
	GapLevel,
} from "./types";
