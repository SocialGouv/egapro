import { CATEGORY_PAY_FIELDS } from "~/modules/declaration-remuneration/schemas";
import type {
	EmployeeCategoryRow,
	EmployeeCategorySubmitData,
} from "~/modules/declaration-remuneration/types";
import {
	type CategoryHeadcounts,
	isCategoryPayApplicable,
} from "~/modules/domain";

export type EmployeeCategory = {
	id: number;
	name: string;
	womenCount: string;
	menCount: string;
	hourlyWomenCount: string;
	hourlyMenCount: string;
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
	womenCount: "",
	menCount: "",
	hourlyWomenCount: "",
	hourlyMenCount: "",
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
		womenCount: row.womenCount?.toString() ?? "",
		menCount: row.menCount?.toString() ?? "",
		hourlyWomenCount: row.hourlyWomenCount?.toString() ?? "",
		hourlyMenCount: row.hourlyMenCount?.toString() ?? "",
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

export type CategoryCountFields = Pick<
	EmployeeCategory,
	"womenCount" | "menCount" | "hourlyWomenCount" | "hourlyMenCount"
>;

type CategoryPayFields = Record<(typeof CATEGORY_PAY_FIELDS)[number], string>;

type ParsedCategoryHeadcounts = {
	womenCount: number | undefined;
	menCount: number | undefined;
	hourlyWomenCount: number | undefined;
	hourlyMenCount: number | undefined;
};

export function toCategoryHeadcounts(
	cat: CategoryCountFields,
): ParsedCategoryHeadcounts {
	return {
		womenCount: toInt(cat.womenCount),
		menCount: toInt(cat.menCount),
		hourlyWomenCount: toInt(cat.hourlyWomenCount),
		hourlyMenCount: toInt(cat.hourlyMenCount),
	} satisfies CategoryHeadcounts;
}

/** Clear every pay value when one sex is absent from both workforce rows.
 *  The input is left untouched so this can normalize form defaults and imports. */
export function withoutPayValuesWhenNotApplicable<
	T extends CategoryCountFields & CategoryPayFields,
>(category: T): T {
	if (isCategoryPayApplicable(toCategoryHeadcounts(category))) return category;
	const cleared = { ...category };
	for (const field of CATEGORY_PAY_FIELDS) {
		Object.assign(cleared, { [field]: "" });
	}
	return cleared;
}

export function toSubmitData(
	categories: EmployeeCategory[],
	source: string,
): EmployeeCategorySubmitData {
	return {
		source,
		categories: categories.map((cat) => {
			const headcounts = toCategoryHeadcounts(cat);
			const payApplicable = isCategoryPayApplicable(headcounts);
			return {
				name: cat.name,
				data: {
					...headcounts,
					annualBaseWomen: payApplicable
						? toStr(cat.annualBaseWomen)
						: undefined,
					annualBaseMen: payApplicable ? toStr(cat.annualBaseMen) : undefined,
					annualVariableWomen: payApplicable
						? toStr(cat.annualVariableWomen)
						: undefined,
					annualVariableMen: payApplicable
						? toStr(cat.annualVariableMen)
						: undefined,
					hourlyBaseWomen: payApplicable
						? toStr(cat.hourlyBaseWomen)
						: undefined,
					hourlyBaseMen: payApplicable ? toStr(cat.hourlyBaseMen) : undefined,
					hourlyVariableWomen: payApplicable
						? toStr(cat.hourlyVariableWomen)
						: undefined,
					hourlyVariableMen: payApplicable
						? toStr(cat.hourlyVariableMen)
						: undefined,
				},
			};
		}),
	};
}
