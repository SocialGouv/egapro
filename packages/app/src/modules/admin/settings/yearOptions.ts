import { FIRST_DECLARATION_YEAR, getCurrentYear } from "~/modules/domain";

export type YearOption = { year: number; label: string };

export function buildYearOptions(
	configuredYears: readonly number[],
): YearOption[] {
	const max = getCurrentYear() + 10;
	const configured = new Set(configuredYears);
	const options: YearOption[] = [];
	for (let year = FIRST_DECLARATION_YEAR; year <= max; year++) {
		options.push({
			year,
			label: configured.has(year) ? String(year) : `${year} (non configurée)`,
		});
	}
	return options;
}
