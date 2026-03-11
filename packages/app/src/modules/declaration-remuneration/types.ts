export type CategoryData = {
	name: string;
	women: number;
	men: number;
};

export type StepCategoryData = {
	name: string;
	womenCount?: number;
	menCount?: number;
	womenValue?: string;
	menValue?: string;
	womenMedianValue?: string;
	menMedianValue?: string;
};

export type PayGapField = "womenValue" | "menValue";

export type PayGapRow = {
	label: string;
	womenValue: string;
	menValue: string;
};

export type VariablePayData = {
	rows: PayGapRow[];
	beneficiaryWomen: string;
	beneficiaryMen: string;
};

export type EmployeeCategoryRow = {
	name: string;
	detail: string;
	womenCount: number | null;
	menCount: number | null;
	annualBaseWomen: string | null;
	annualBaseMen: string | null;
	annualVariableWomen: string | null;
	annualVariableMen: string | null;
	hourlyBaseWomen: string | null;
	hourlyBaseMen: string | null;
	hourlyVariableWomen: string | null;
	hourlyVariableMen: string | null;
};

export type EmployeeCategorySubmitData = {
	source: string;
	categories: Array<{
		name: string;
		detail: string;
		data: {
			womenCount?: number;
			menCount?: number;
			annualBaseWomen?: string;
			annualBaseMen?: string;
			annualVariableWomen?: string;
			annualVariableMen?: string;
			hourlyBaseWomen?: string;
			hourlyBaseMen?: string;
			hourlyVariableWomen?: string;
			hourlyVariableMen?: string;
		};
	}>;
};

export const DEFAULT_CATEGORIES = [
	"Ouvriers",
	"Employés",
	"Techniciens et agents de maîtrise",
	"Ingénieurs et cadres",
] as const;

export const STEP_TITLES = [
	"Introduction",
	"Effectifs physiques pris en compte pour le calcul des indicateurs",
	"Écart de rémunération",
	"Écart de rémunération variable ou complémentaire",
	"Proportion de femmes et d'hommes dans chaque quartile de rémunération",
	"Écart de rémunération par catégories de salariés (salaire de base et primes)",
	"Récapitulatif de votre déclaration",
] as const;

export const TOTAL_STEPS = 6;
