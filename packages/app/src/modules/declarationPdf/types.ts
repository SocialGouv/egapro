import type {
	EmployeeCategoryRow,
	PayGapReferences,
	Step2Data,
	Step3Data,
	Step4Data,
} from "~/modules/declaration-remuneration";

export type DeclarationPdfDeclarant = {
	name: string;
	email: string;
	phone: string;
};

export type DeclarationPdfCompany = {
	name: string;
	siren: string;
	address: string;
	nafCode: string | null;
	nafLabel: string | null;
	workforceDisplay: string;
};

export type DeclarationPdfData = {
	year: number;
	workforceYear: number;
	isSecondDeclaration: boolean;
	transmittedAt: string;
	referencePeriod: string;
	declarant: DeclarationPdfDeclarant;
	company: DeclarationPdfCompany;
	totalWomen: number;
	totalMen: number;
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	/** Persisted gaps for steps 2 and 3 — printed as recorded rather than recomputed. */
	step2Gaps: PayGapReferences;
	step3Gaps: PayGapReferences;
	categories: EmployeeCategoryRow[];
	source: string | null;
};
