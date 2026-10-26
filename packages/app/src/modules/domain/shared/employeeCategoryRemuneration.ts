export const MIN_HEADCOUNT_REQUIRING_PAY_DATA = 1;

export const CATEGORY_PAY_BASES = [
	{
		basis: "annual",
		womenCountField: "womenCount",
		menCountField: "menCount",
		womenPayFields: ["annualBaseWomen", "annualVariableWomen"],
		menPayFields: ["annualBaseMen", "annualVariableMen"],
	},
	{
		basis: "hourly",
		womenCountField: "hourlyWomenCount",
		menCountField: "hourlyMenCount",
		womenPayFields: ["hourlyBaseWomen", "hourlyVariableWomen"],
		menPayFields: ["hourlyBaseMen", "hourlyVariableMen"],
	},
] as const;

export const PAY_FIELDS_WOMEN = CATEGORY_PAY_BASES.flatMap(
	(base) => base.womenPayFields,
);

export const PAY_FIELDS_MEN = CATEGORY_PAY_BASES.flatMap(
	(base) => base.menPayFields,
);

export const CATEGORY_PAY_FIELDS = [...PAY_FIELDS_WOMEN, ...PAY_FIELDS_MEN];

type CategoryPayValues = Partial<
	Record<(typeof CATEGORY_PAY_FIELDS)[number], string | null | undefined>
>;

export function isSexRemunerationComplete(
	headcount: number | undefined,
	payFieldValues: readonly (string | undefined)[],
): boolean {
	const normalizedHeadcount = headcount ?? 0;
	if (
		Number.isNaN(normalizedHeadcount) ||
		normalizedHeadcount < MIN_HEADCOUNT_REQUIRING_PAY_DATA
	) {
		return true;
	}
	return payFieldValues.every((value) => Boolean(value));
}

/** Headcount cells of one job category, one Femmes/Hommes pair per pay basis.
 *  An empty cell is unknown, not zero: only an explicit 0 is a zero. */
export type CategoryHeadcounts = {
	womenCount?: number | null;
	menCount?: number | null;
	hourlyWomenCount?: number | null;
	hourlyMenCount?: number | null;
};

export type CategoryPayBasis = (typeof CATEGORY_PAY_BASES)[number]["basis"];

/** A basis is calculable only when both sexes have at least one employee.
 *  Empty counts remain unknown so a new category can still be completed. */
export function isCategoryPayBasisApplicable(
	headcounts: CategoryHeadcounts,
	basis: CategoryPayBasis,
): boolean {
	const definition = CATEGORY_PAY_BASES.find((item) => item.basis === basis);
	if (!definition) return true;
	return (
		headcounts[definition.womenCountField] !== 0 &&
		headcounts[definition.menCountField] !== 0
	);
}

export function isCategoryPayApplicable(
	headcounts: CategoryHeadcounts,
): boolean {
	return CATEGORY_PAY_BASES.some((base) =>
		isCategoryPayBasisApplicable(headcounts, base.basis),
	);
}

/** Whether pay values must survive normalization and be rendered as data.
 *  Existing values are retained only on historical read-only surfaces. */
export function shouldRetainCategoryPayValues(
	headcounts: CategoryHeadcounts,
	payValues: CategoryPayValues,
	preserveLegacyPay: boolean,
): boolean {
	return CATEGORY_PAY_BASES.some((base) =>
		shouldRetainCategoryPayBasisValues(
			headcounts,
			payValues,
			preserveLegacyPay,
			base.basis,
		),
	);
}

/** Whether a historical read-only declaration should retain one basis. */
export function shouldRetainCategoryPayBasisValues(
	headcounts: CategoryHeadcounts,
	payValues: CategoryPayValues,
	preserveLegacyPay: boolean,
	basis: CategoryPayBasis,
): boolean {
	const definition = CATEGORY_PAY_BASES.find((item) => item.basis === basis);
	if (!definition) return true;
	return (
		isCategoryPayBasisApplicable(headcounts, basis) ||
		(preserveLegacyPay &&
			[...definition.womenPayFields, ...definition.menPayFields].some(
				(field) => {
					const value = payValues[field];
					return typeof value === "string" && value.trim() !== "";
				},
			))
	);
}
