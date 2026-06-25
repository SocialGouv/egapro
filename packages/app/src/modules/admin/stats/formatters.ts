type WithUnitOption = {
	withUnit?: boolean;
};

export function formatPercent(
	value: number,
	{ withUnit = false }: WithUnitOption = {},
): string {
	const formatted = value.toLocaleString("fr-FR", {
		maximumFractionDigits: 1,
		minimumFractionDigits: 1,
	});
	return withUnit ? `${formatted} %` : formatted;
}

export function formatCount(value: number): string {
	return value.toLocaleString("fr-FR");
}

export function formatDecimal(value: number): string {
	return value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

export function formatDays(
	value: number | null,
	{ withUnit = false }: WithUnitOption = {},
): string {
	if (value === null) return "—";
	const formatted = value.toLocaleString("fr-FR", {
		maximumFractionDigits: 1,
		minimumFractionDigits: 1,
	});
	return withUnit ? `${formatted} j` : formatted;
}
