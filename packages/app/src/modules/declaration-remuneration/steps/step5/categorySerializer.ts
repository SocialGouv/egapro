import type {
	EmployeeCategoryRow,
	EmployeeCategorySubmitData,
} from "~/modules/declaration-remuneration/types";

export type EmployeeCategory = {
	id: number;
	name: string;
	detail: string;
	womenCount: string;
	menCount: string;
	annualBaseWomen: string;
	annualBaseMen: string;
	annualVariableWomen: string;
	annualVariableMen: string;
	hourlyBaseWomen: string;
	hourlyBaseMen: string;
	hourlyVariableWomen: string;
	hourlyVariableMen: string;
};

const EMPTY_FIELDS = {
	name: "",
	detail: "",
	womenCount: "",
	menCount: "",
	annualBaseWomen: "",
	annualBaseMen: "",
	annualVariableWomen: "",
	annualVariableMen: "",
	hourlyBaseWomen: "",
	hourlyBaseMen: "",
	hourlyVariableWomen: "",
	hourlyVariableMen: "",
} as const;

export function createEmptyCategory(id: number): EmployeeCategory {
	return { id, ...EMPTY_FIELDS };
}

export function fromDatabaseRows(
	rows: EmployeeCategoryRow[],
	nextId: () => number,
): EmployeeCategory[] {
	return rows.map((row) => ({
		id: nextId(),
		name: row.name,
		detail: row.detail,
		womenCount: row.womenCount?.toString() ?? "",
		menCount: row.menCount?.toString() ?? "",
		annualBaseWomen: row.annualBaseWomen ?? "",
		annualBaseMen: row.annualBaseMen ?? "",
		annualVariableWomen: row.annualVariableWomen ?? "",
		annualVariableMen: row.annualVariableMen ?? "",
		hourlyBaseWomen: row.hourlyBaseWomen ?? "",
		hourlyBaseMen: row.hourlyBaseMen ?? "",
		hourlyVariableWomen: row.hourlyVariableWomen ?? "",
		hourlyVariableMen: row.hourlyVariableMen ?? "",
	}));
}

function toInt(val: string): number | undefined {
	if (!val) return undefined;
	const n = Number.parseInt(val, 10);
	return Number.isNaN(n) ? undefined : n;
}

function toStr(val: string): string | undefined {
	return val || undefined;
}

export function toSubmitData(
	categories: EmployeeCategory[],
	source: string,
): EmployeeCategorySubmitData {
	return {
		source,
		categories: categories.map((cat) => ({
			name: cat.name,
			detail: cat.detail,
			data: {
				womenCount: toInt(cat.womenCount),
				menCount: toInt(cat.menCount),
				annualBaseWomen: toStr(cat.annualBaseWomen),
				annualBaseMen: toStr(cat.annualBaseMen),
				annualVariableWomen: toStr(cat.annualVariableWomen),
				annualVariableMen: toStr(cat.annualVariableMen),
				hourlyBaseWomen: toStr(cat.hourlyBaseWomen),
				hourlyBaseMen: toStr(cat.hourlyBaseMen),
				hourlyVariableWomen: toStr(cat.hourlyVariableWomen),
				hourlyVariableMen: toStr(cat.hourlyVariableMen),
			},
		})),
	};
}
