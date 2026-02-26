export { DeclarationIntro } from "./DeclarationIntro";
export { DeclarationLayout } from "./DeclarationLayout";
export { MissingSiret } from "./MissingSiret";
export { Step1Workforce } from "./steps/Step1Workforce";
export { Step2PayGap } from "./steps/Step2PayGap";
export { Step3VariablePay } from "./steps/Step3VariablePay";
export { Step4QuartileDistribution } from "./steps/Step4QuartileDistribution";
export { Step5EmployeeCategories } from "./steps/Step5EmployeeCategories";
export { Step6Review } from "./steps/Step6Review";

export type {
	CategoryData,
	PayGapRow,
	StepCategoryData,
	VariablePayData,
} from "./types";
export { DEFAULT_CATEGORIES, STEP_TITLES, TOTAL_STEPS } from "./types";
