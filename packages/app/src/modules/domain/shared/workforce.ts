export function sumQuartileWorkforce(
	quartiles: { women?: number | null; men?: number | null }[],
): { women: number; men: number; total: number } {
	const { women, men } = quartiles.reduce<{ women: number; men: number }>(
		(acc, q) => ({
			women: acc.women + (q.women ?? 0),
			men: acc.men + (q.men ?? 0),
		}),
		{ women: 0, men: 0 },
	);
	return { women, men, total: women + men };
}

export type CategoryWorkforceInput = {
	womenCount?: string | null;
	menCount?: string | null;
	hourlyWomenCount?: string | null;
	hourlyMenCount?: string | null;
};

export type CategoryWorkforceSums = {
	annual: { women: number; men: number };
	hourly: { women: number; men: number };
};

export function sumCategoryWorkforce(
	categories: CategoryWorkforceInput[],
): CategoryWorkforceSums {
	const parse = (value?: string | null): number => {
		const n = Number.parseInt(value ?? "", 10);
		return Number.isNaN(n) ? 0 : n;
	};
	return categories.reduce<CategoryWorkforceSums>(
		(sum, category) => ({
			annual: {
				women: sum.annual.women + parse(category.womenCount),
				men: sum.annual.men + parse(category.menCount),
			},
			hourly: {
				women: sum.hourly.women + parse(category.hourlyWomenCount),
				men: sum.hourly.men + parse(category.hourlyMenCount),
			},
		}),
		{ annual: { women: 0, men: 0 }, hourly: { women: 0, men: 0 } },
	);
}

export function computeWorkforceTotal(women: number, men: number): number {
	return women + men;
}
