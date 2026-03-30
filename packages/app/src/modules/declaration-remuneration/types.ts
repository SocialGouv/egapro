export type Step1Data = {
	totalWomen: number;
	totalMen: number;
};

export type Step2Data = {
	indicatorAAnnualWomen: string;
	indicatorAAnnualMen: string;
	indicatorAHourlyWomen: string;
	indicatorAHourlyMen: string;
	indicatorCAnnualWomen: string;
	indicatorCAnnualMen: string;
	indicatorCHourlyWomen: string;
	indicatorCHourlyMen: string;
};

export type Step3Data = {
	indicatorBAnnualWomen: string;
	indicatorBAnnualMen: string;
	indicatorBHourlyWomen: string;
	indicatorBHourlyMen: string;
	indicatorDAnnualWomen: string;
	indicatorDAnnualMen: string;
	indicatorDHourlyWomen: string;
	indicatorDHourlyMen: string;
	indicatorEWomen: string;
	indicatorEMen: string;
};

export type QuartileData = {
	threshold?: string;
	women?: number;
	men?: number;
};

export type Step4Data = {
	annual: QuartileData[];
	hourly: QuartileData[];
};

export type PayGapField = "womenValue" | "menValue";

export type PayGapRow = {
	label: string;
	womenValue: string;
	menValue: string;
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
