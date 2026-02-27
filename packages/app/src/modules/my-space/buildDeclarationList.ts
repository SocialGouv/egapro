import type {
	DeclarationItem,
	DeclarationStatus,
	DeclarationType,
} from "./types";

/** Declaration types that every company is expected to file each year. */
const EXPECTED_TYPES: DeclarationType[] = ["remuneration", "representation"];

type DbDeclaration = {
	type: DeclarationType;
	year: number;
	status: DeclarationStatus;
	currentStep: number;
	updatedAt: Date | null;
};

/**
 * Builds the full list of declaration rows by merging expected rows
 * (one per type for the current year) with actual DB records.
 *
 * - Current year: one row per expected type, using DB data when available
 *   or a "to_complete" placeholder otherwise.
 * - Previous years: only rows that exist in DB.
 * - Sorted: current year first, then previous years descending.
 */
export function buildDeclarationList(
	siren: string,
	dbDeclarations: DbDeclaration[],
	currentYear: number,
): DeclarationItem[] {
	const rows: DeclarationItem[] = [];

	// Current year: ensure one row per expected type
	for (const type of EXPECTED_TYPES) {
		const existing = dbDeclarations.find(
			(d) => d.year === currentYear && d.type === type,
		);
		if (existing) {
			rows.push({
				type,
				siren,
				year: currentYear,
				status: existing.status,
				currentStep: existing.currentStep,
				updatedAt: existing.updatedAt,
			});
		} else {
			rows.push({
				type,
				siren,
				year: currentYear,
				status: "to_complete",
				currentStep: 0,
				updatedAt: null,
			});
		}
	}

	// Previous years: only show DB records, sorted by year desc
	const previousYears = dbDeclarations
		.filter((d) => d.year < currentYear)
		.sort((a, b) => b.year - a.year);

	for (const d of previousYears) {
		rows.push({
			type: d.type,
			siren,
			year: d.year,
			status: d.status,
			currentStep: d.currentStep,
			updatedAt: d.updatedAt,
		});
	}

	return rows;
}
