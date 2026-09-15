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

/** Whether a job category declares pay data at all. False only when one sex
 *  has an explicit 0 on both the annual and hourly rows: the category then has
 *  no gap to declare (#3678). */
export function isCategoryPayApplicable(
	headcounts: CategoryHeadcounts,
): boolean {
	const hasNoWomen =
		headcounts.womenCount === 0 && headcounts.hourlyWomenCount === 0;
	const hasNoMen = headcounts.menCount === 0 && headcounts.hourlyMenCount === 0;
	return !hasNoWomen && !hasNoMen;
}

/** Whether pay values must survive normalization and be rendered as data.
 *  Existing values are retained only on historical read-only surfaces. */
export function shouldRetainCategoryPayValues(
	headcounts: CategoryHeadcounts,
	payValues: CategoryPayValues,
	preserveLegacyPay: boolean,
): boolean {
	return (
		isCategoryPayApplicable(headcounts) ||
		(preserveLegacyPay &&
			CATEGORY_PAY_FIELDS.some((field) => {
				const value = payValues[field];
				return typeof value === "string" && value.trim() !== "";
			}))
	);
}
