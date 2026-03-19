export { DeclarationLayout } from "./DeclarationLayout";
export { MissingSiret } from "./MissingSiret";
export { StepPageClient } from "./StepPageClient";
export {
	categoryFormEntrySchema,
	categoryFormSchema,
	jointEvaluationUploadSchema,
	saveCompliancePathSchema,
	updateEmployeeCategoriesSchema,
	updateStep1Schema,
	updateStepCategoriesSchema,
} from "./schemas";
export { ComplianceCompletionEffect } from "./shared/ComplianceCompletionEffect";
export { DevFillButton } from "./shared/DevFillButton";
export {
	computeGap,
	computePercentage,
	formatCurrency,
	formatGap,
	gapLevel,
	hasGapsAboveThreshold,
} from "./shared/gapUtils";
export type {
	GipMdsRow,
	GipPrefillData,
	GipQuartileData,
} from "./shared/gipMdsMapping";
export { CSV_TO_SCHEMA_MAP, mapGipToFormData } from "./shared/gipMdsMapping";
export { mapDbCategories } from "./shared/mapDbCategories";
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
	SECOND_DECLARATION_TOTAL_STEPS,
	SecondDeclarationStep1Info,
	SecondDeclarationStep2Form,
	SecondDeclarationStep3Review,
	SecondDeclarationStepPage,
} from "./steps/secondDeclaration";
export { parseEmployeeCategories } from "./steps/step6/parseStep5Categories";
export type {
	CategoryData,
	EmployeeCategoryRow,
	PayGapRow,
	StepCategoryData,
	VariablePayData,
} from "./types";
export { DEFAULT_CATEGORIES, STEP_TITLES, TOTAL_STEPS } from "./types";
