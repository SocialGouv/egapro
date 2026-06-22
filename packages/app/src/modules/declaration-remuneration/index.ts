export { DeclarationLayout } from "./DeclarationLayout";
export { MissingSiret } from "./MissingSiret";
export { RecapitulatifPage } from "./recapitulatif";
export { StepPageClient } from "./StepPageClient";
export {
	categoryFormEntrySchema,
	categoryFormSchema,
	saveCompliancePathSchema,
	updateEmployeeCategoriesSchema,
	updateStep1Schema,
	updateStep2Schema,
	updateStep3Schema,
	updateStep4Schema,
} from "./schemas";
export { computeIndicatorPercentages } from "./shared/computeIndicatorPercentages";
export { DevFillButton } from "./shared/DevFillButton";
export type {
	ClearDraftInput,
	DraftBlob,
	GetDraftInput,
	SaveDraftInput,
} from "./shared/draft/schemas";
export {
	clearDraftInput,
	getDraftInput,
	saveDraftInput,
} from "./shared/draft/schemas";
export { GAP_LEVEL_LABELS, gapBadgeClass } from "./shared/gapBadge";
export type {
	GipMdsRow,
	GipPrefillData,
	GipQuartileData,
} from "./shared/gipMdsMapping";
export { CSV_TO_SCHEMA_MAP, mapGipToFormData } from "./shared/gipMdsMapping";
export { getEffectiveGipPrefillData } from "./shared/gipToStepData";
export { ComplianceConfirmation } from "./steps/ComplianceConfirmation";
export { CompliancePathChoice } from "./steps/CompliancePathChoice";
export { CompliancePathPage } from "./steps/CompliancePathPage";
export { JointEvaluationPage } from "./steps/jointEvaluation";
export { Step1Workforce } from "./steps/Step1Workforce";
export { Step2PayGap } from "./steps/Step2PayGap";
export { Step3VariablePay } from "./steps/Step3VariablePay";
export { Step4QuartileDistribution } from "./steps/Step4QuartileDistribution";
export { Step5EmployeeCategories } from "./steps/Step5EmployeeCategories";
export { Step6Review } from "./steps/Step6Review";
export {
	COMPLIANCE_FUNNEL,
	SECOND_DECLARATION_TOTAL_STEPS,
	SecondDeclarationStep1Info,
	SecondDeclarationStep2Form,
	SecondDeclarationStep3Review,
	SecondDeclarationStepPage,
} from "./steps/secondDeclaration";
export { parseEmployeeCategories } from "./steps/step6";
export type {
	EmployeeCategoryRow,
	PayGapRow,
	QuartileData,
	QuartileTuple,
	Step1Data,
	Step2Data,
	Step3Data,
	Step4Data,
	WorkforceRow,
} from "./types";
export { DEFAULT_CATEGORIES, STEP_TITLES, TOTAL_STEPS } from "./types";
