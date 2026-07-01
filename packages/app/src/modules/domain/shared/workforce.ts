export function sumQuartileWorkforce(
	quartiles: { women?: number | null; men?: number | null }[],
): { women: number; men: number; total: number } {
	const women = quartiles.reduce((sum, q) => sum + (q.women ?? 0), 0);
	const men = quartiles.reduce((sum, q) => sum + (q.men ?? 0), 0);
	return { women, men, total: women + men };
}

export function sumCategoryWorkforce(
	categories: { womenCount?: string | null; menCount?: string | null }[],
): { women: number; men: number } {
	const parse = (value?: string | null): number => {
		const n = Number.parseInt(value ?? "", 10);
		return Number.isNaN(n) ? 0 : n;
	};
	return categories.reduce(
		(sum, category) => ({
			women: sum.women + parse(category.womenCount),
			men: sum.men + parse(category.menCount),
		}),
		{ women: 0, men: 0 },
	);
}

export function computeWorkforceTotal(women: number, men: number): number {
	return women + men;
}
