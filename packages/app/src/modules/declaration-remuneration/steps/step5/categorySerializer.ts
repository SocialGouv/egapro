import type {
	EmployeeCategoryRow,
	EmployeeCategorySubmitData,
} from "~/modules/declaration-remuneration/types";
import {
	CATEGORY_PAY_BASES,
	type CATEGORY_PAY_FIELDS,
	type CategoryHeadcounts,
	isCategoryPayBasisApplicable,
	toStrictInt,
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

function toHeadcount(val: string): number | undefined {
	return toStrictInt(val) ?? undefined;
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
		womenCount: toHeadcount(cat.womenCount),
		menCount: toHeadcount(cat.menCount),
		hourlyWomenCount: toHeadcount(cat.hourlyWomenCount),
		hourlyMenCount: toHeadcount(cat.hourlyMenCount),
	} satisfies CategoryHeadcounts;
}

/** Clear pay values for each basis where one sex has no workforce.
 *  The input is left untouched so this can normalize form defaults and imports. */
export function withoutPayValuesWhenNotApplicable<
	T extends CategoryCountFields & CategoryPayFields,
>(category: T): T {
	const headcounts = toCategoryHeadcounts(category);
	const cleared = { ...category };
	let changed = false;
	for (const base of CATEGORY_PAY_BASES) {
		if (isCategoryPayBasisApplicable(headcounts, base.basis)) continue;
		for (const field of [...base.womenPayFields, ...base.menPayFields]) {
			if (cleared[field] !== "") changed = true;
			Object.assign(cleared, { [field]: "" });
		}
	}
	return changed ? cleared : category;
}

export function toSubmitData(
	categories: EmployeeCategory[],
	source: string,
): EmployeeCategorySubmitData {
	return {
		source,
		categories: categories.map((cat) => {
			const headcounts = toCategoryHeadcounts(cat);
			const annualApplicable = isCategoryPayBasisApplicable(
				headcounts,
				"annual",
			);
			const hourlyApplicable = isCategoryPayBasisApplicable(
				headcounts,
				"hourly",
			);
			return {
				name: cat.name,
				data: {
					...headcounts,
					annualBaseWomen: annualApplicable
						? toStr(cat.annualBaseWomen)
						: undefined,
					annualBaseMen: annualApplicable
						? toStr(cat.annualBaseMen)
						: undefined,
					annualVariableWomen: annualApplicable
						? toStr(cat.annualVariableWomen)
						: undefined,
					annualVariableMen: annualApplicable
						? toStr(cat.annualVariableMen)
						: undefined,
					hourlyBaseWomen: hourlyApplicable
						? toStr(cat.hourlyBaseWomen)
						: undefined,
					hourlyBaseMen: hourlyApplicable
						? toStr(cat.hourlyBaseMen)
						: undefined,
					hourlyVariableWomen: hourlyApplicable
						? toStr(cat.hourlyVariableWomen)
						: undefined,
					hourlyVariableMen: hourlyApplicable
						? toStr(cat.hourlyVariableMen)
						: undefined,
				},
			};
		}),
	};
}
