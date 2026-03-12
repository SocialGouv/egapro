import { computeGap } from "~/modules/declaration-remuneration/shared/gapUtils";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";

export type ParsedCategory = {
	index: number;
	name: string;
	annualBaseGap: number | null;
	annualVariableGap: number | null;
	hourlyBaseGap: number | null;
	hourlyVariableGap: number | null;
};

function gapOrNull(women: string | null, men: string | null): number | null {
	if (!women || !men) return null;
	return computeGap(women, men);
}

export function parseEmployeeCategories(
	categories: EmployeeCategoryRow[],
): ParsedCategory[] {
	return categories.map((cat, index) => ({
		index,
		name: cat.name,
		annualBaseGap: gapOrNull(cat.annualBaseWomen, cat.annualBaseMen),
		annualVariableGap: gapOrNull(
			cat.annualVariableWomen,
			cat.annualVariableMen,
		),
		hourlyBaseGap: gapOrNull(cat.hourlyBaseWomen, cat.hourlyBaseMen),
		hourlyVariableGap: gapOrNull(
			cat.hourlyVariableWomen,
			cat.hourlyVariableMen,
		),
	}));
}
