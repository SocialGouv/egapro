import type { EmployeeCategory } from "../steps/step5/categorySerializer";
import type { PayGapRow, WorkforceRow } from "../types";

// Step 1 - Workforce (120 women + 130 men = 250 total)
export const DEV_STEP1_CATEGORIES: WorkforceRow[] = [
	{ name: "Nombre de salariés", women: 120, men: 130 },
];

// Step 2 - Pay gap (4 rows, some gaps > 5%, some < 5%)
export const DEV_STEP2_ROWS: PayGapRow[] = [
	{ label: "Annuelle brute moyenne", womenValue: "35000", menValue: "38000" },
	{ label: "Horaire brute moyenne", womenValue: "18.50", menValue: "19.20" },
	{ label: "Annuelle brute médiane", womenValue: "33500", menValue: "36000" },
	{ label: "Horaire brute médiane", womenValue: "17.80", menValue: "18.50" },
];

// Step 3 - Variable pay (4 rows + beneficiary counts)
export const DEV_STEP3_ROWS: PayGapRow[] = [
	{ label: "Annuelle brute moyenne", womenValue: "2500", menValue: "3200" },
	{ label: "Horaire brute moyenne", womenValue: "1.30", menValue: "1.60" },
	{ label: "Annuelle brute médiane", womenValue: "2200", menValue: "2800" },
	{ label: "Horaire brute médiane", womenValue: "1.15", menValue: "1.40" },
];
export const DEV_STEP3_BENEFICIARY_WOMEN = "95";
export const DEV_STEP3_BENEFICIARY_MEN = "110";

// Step 4 - Quartile distribution (annual + hourly)
export const DEV_STEP4_ANNUAL = [
	{ name: "1er quartile", womenCount: 35, menCount: 28, womenValue: "22000" },
	{ name: "2e quartile", womenCount: 30, menCount: 32, womenValue: "28500" },
	{ name: "3e quartile", womenCount: 28, menCount: 35, womenValue: "35000" },
	{ name: "4e quartile", womenCount: 27, menCount: 35, womenValue: "48000" },
];

export const DEV_STEP4_HOURLY = [
	{ name: "1er quartile", womenCount: 35, menCount: 28, womenValue: "11.50" },
	{ name: "2e quartile", womenCount: 30, menCount: 32, womenValue: "14.80" },
	{ name: "3e quartile", womenCount: 28, menCount: 35, womenValue: "18.20" },
	{ name: "4e quartile", womenCount: 27, menCount: 35, womenValue: "24.50" },
];

// Step 5 - Employee categories (totals: 40+30+25+25=120 women, 45+35+25+25=130 men)
export const DEV_STEP5_SOURCE = "convention-collective";

export function createDevStep5Categories(
	nextId: () => number,
): EmployeeCategory[] {
	return [
		{
			id: nextId(),
			name: "Ouvriers",
			detail: "Opérateurs, manutentionnaires",
			womenCount: "40",
			menCount: "45",
			annualBaseWomen: "24000",
			annualBaseMen: "25500",
			annualVariableWomen: "1200",
			annualVariableMen: "1500",
			hourlyBaseWomen: "12.50",
			hourlyBaseMen: "13.20",
			hourlyVariableWomen: "0.62",
			hourlyVariableMen: "0.78",
		},
		{
			id: nextId(),
			name: "Employés",
			detail: "Assistants, secrétaires",
			womenCount: "30",
			menCount: "35",
			annualBaseWomen: "27000",
			annualBaseMen: "28000",
			annualVariableWomen: "1800",
			annualVariableMen: "2100",
			hourlyBaseWomen: "14.00",
			hourlyBaseMen: "14.50",
			hourlyVariableWomen: "0.93",
			hourlyVariableMen: "1.09",
		},
		{
			id: nextId(),
			name: "Techniciens et agents de maîtrise",
			detail: "Contremaîtres, techniciens",
			womenCount: "25",
			menCount: "25",
			annualBaseWomen: "35000",
			annualBaseMen: "37500",
			annualVariableWomen: "3500",
			annualVariableMen: "4200",
			hourlyBaseWomen: "18.20",
			hourlyBaseMen: "19.50",
			hourlyVariableWomen: "1.82",
			hourlyVariableMen: "2.18",
		},
		{
			id: nextId(),
			name: "Ingénieurs et cadres",
			detail: "Responsables, directeurs",
			womenCount: "25",
			menCount: "25",
			annualBaseWomen: "48000",
			annualBaseMen: "52000",
			annualVariableWomen: "6000",
			annualVariableMen: "7500",
			hourlyBaseWomen: "25.00",
			hourlyBaseMen: "27.00",
			hourlyVariableWomen: "3.12",
			hourlyVariableMen: "3.90",
		},
	];
}
