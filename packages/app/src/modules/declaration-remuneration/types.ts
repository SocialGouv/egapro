export interface CategoryData {
	name: string;
	women: number;
	men: number;
}

export interface StepCategoryData {
	name: string;
	womenCount?: number;
	menCount?: number;
	womenValue?: string;
	menValue?: string;
	womenMedianValue?: string;
	menMedianValue?: string;
}

export interface PayGapRow {
	label: string;
	womenValue: string;
	menValue: string;
}

export interface VariablePayData {
	rows: PayGapRow[];
	beneficiaryWomen: string;
	beneficiaryMen: string;
}

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
	"Écart de rémunération par catégories de salariés",
	"Vérifier les informations",
] as const;

export const TOTAL_STEPS = 6;
