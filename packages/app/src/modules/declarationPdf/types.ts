import type {
	EmployeeCategoryRow,
	PayGapRow,
} from "~/modules/declaration-remuneration/types";

export type CategoryData = {
	name: string;
	women: number;
	men: number;
};

export type VariablePayData = {
	rows: PayGapRow[];
	beneficiaryWomen: string;
	beneficiaryMen: string;
};

export type QuartileCategory = {
	name: string;
	womenCount?: number;
	menCount?: number;
	womenValue?: string;
	menValue?: string;
	womenMedianValue?: string;
	menMedianValue?: string;
};

export type DeclarationPdfData = {
	companyName: string;
	siren: string;
	year: number;
	generatedAt: string;
	isSecondDeclaration: boolean;
	totalWomen: number;
	totalMen: number;
	step1Categories: CategoryData[];
	step2Rows: PayGapRow[];
	step3Data: VariablePayData;
	step4Categories: QuartileCategory[];
	step5Categories: EmployeeCategoryRow[];
};
