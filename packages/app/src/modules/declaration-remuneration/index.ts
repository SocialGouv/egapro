export { DeclarationLayout } from "./DeclarationLayout";
export { MissingSiret } from "./MissingSiret";
export { StepPageClient } from "./StepPageClient";
export {
	computeGap,
	computePercentage,
	formatCurrency,
	formatGap,
	gapLevel,
	hasGapsAboveThreshold,
} from "./shared/gapUtils";
export { mapDbCategories } from "./shared/mapDbCategories";
export { CompliancePathChoice } from "./steps/CompliancePathChoice";
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
} from "./steps/secondDeclaration";
export { parseStep5Categories } from "./steps/step6/parseStep5Categories";
export type {
	CategoryData,
	PayGapRow,
	StepCategoryData,
	VariablePayData,
} from "./types";
export { DEFAULT_CATEGORIES, STEP_TITLES, TOTAL_STEPS } from "./types";
