import type { Step1Data } from "~/modules/declaration-remuneration/types";

/** The two pay bases the physical workforce is declared against (#4247). */
export type WorkforceBasis = "annual" | "hourly";

export type WorkforceField = keyof Step1Data;

export type WorkforceRowDefinition = {
	basis: WorkforceBasis;
	label: string;
	womenField: WorkforceField;
	menField: WorkforceField;
};

export const WORKFORCE_ROWS: readonly WorkforceRowDefinition[] = [
	{
		basis: "annual",
		label: "Rémunération annuelle",
		womenField: "totalWomen",
		menField: "totalMen",
	},
	{
		basis: "hourly",
		label: "Rémunération horaire",
		womenField: "hourlyWomen",
		menField: "hourlyMen",
	},
];

export const WORKFORCE_FIELDS: readonly WorkforceField[] =
	WORKFORCE_ROWS.flatMap((row) => [row.womenField, row.menField]);

/** Accessible name of a cell input — the column header alone ("Femmes") would
 *  not tell the two rows apart. */
export function workforceFieldLabel(
	row: WorkforceRowDefinition,
	sex: "women" | "men",
): string {
	const sexLabel = sex === "women" ? "Nombre de femmes" : "Nombre d'hommes";
	return `${row.label} — ${sexLabel}`;
}

export function workforceFieldId(
	row: WorkforceRowDefinition,
	sex: "women" | "men",
): string {
	return `step1-${row.basis}-${sex}`;
}

export function workforceFieldIdFromField(field: WorkforceField): string {
	const row = WORKFORCE_ROWS.find(
		(candidate) =>
			candidate.womenField === field || candidate.menField === field,
	);
	if (!row) throw new Error(`Unknown workforce field: ${field}`);
	return workforceFieldId(row, row.womenField === field ? "women" : "men");
}

export function workforceFieldErrorMessage(
	row: WorkforceRowDefinition,
	sex: "women" | "men",
): string {
	const field = sex === "women" ? "nombre de femmes" : "nombre d'hommes";
	return `Renseignez le ${field} pour la ${row.label.toLowerCase()}.`;
}
