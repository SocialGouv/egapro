import type {
	CategoryData,
	PayGapRow,
	StepCategoryData,
	VariablePayData,
} from "~/modules/declaration-remuneration/types";

export type DeclarationPdfData = {
	companyName: string;
	siren: string;
	year: number;
	generatedAt: string;
	totalWomen: number;
	totalMen: number;
	step1Categories: CategoryData[];
	step2Rows: PayGapRow[];
	step3Data: VariablePayData;
	step4Categories: StepCategoryData[];
	step5Categories: StepCategoryData[];
};
