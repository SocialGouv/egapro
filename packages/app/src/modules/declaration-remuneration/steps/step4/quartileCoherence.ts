import type { QuartileTuple } from "~/modules/declaration-remuneration";
import { QUARTILE_COUNT } from "~/modules/domain";
import {
	type CountField,
	type RecapEntry,
	TABLE_LABEL,
	type TableType,
} from "./quartileErrors";

export type QuartileReference = { women?: number; men?: number };

export type CoherenceError = {
	table: TableType;
	field: CountField;
	expected: number;
	total: number;
};

function sumCounts(table: QuartileTuple, field: CountField): number | null {
	let sum = 0;
	for (let i = 0; i < QUARTILE_COUNT; i++) {
		const value = table[i]?.[field];
		if (typeof value !== "number") return null;
		sum += value;
	}
	return sum;
}

// Blocking control (decision #4260): both the annual and hourly tables are
// compared to the same reference — the step 1 headcount (declaration.totalWomen
// / totalMen), never the GIP file. The comparison only runs once a column's
// four counts are all filled in; an undefined reference (step 1 not yet
// completed) disables the control entirely.
export function deriveCoherenceErrors(
	values: { annual: QuartileTuple; hourly: QuartileTuple },
	reference: QuartileReference,
): CoherenceError[] {
	const out: CoherenceError[] = [];
	for (const table of ["annual", "hourly"] as const) {
		for (const field of ["women", "men"] as const) {
			const expected = reference[field];
			if (expected === undefined) continue;
			const total = sumCounts(values[table], field);
			if (total === null) continue;
			if (total !== expected) out.push({ table, field, expected, total });
		}
	}
	return out;
}

export function coherenceErrorLabel(error: CoherenceError): string {
	const sexLabel = error.field === "women" ? "de femmes" : "d'hommes";
	const tableAdjective = error.table === "annual" ? "annuel" : "horaire";
	return `Le nombre total ${sexLabel} renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total ${tableAdjective} : ${error.expected}).`;
}

/**
 * Builds anchor entries for the submission recap alert (RGAA 11.10/11.13).
 * One entry per table, never per sex: both sexes of a table share the same
 * alert, so a second entry would duplicate the anchor and the React key.
 */
export function buildCoherenceRecap(errors: CoherenceError[]): RecapEntry[] {
	return (["annual", "hourly"] as const).flatMap((table) => {
		const tableErrors = errors.filter((error) => error.table === table);
		if (tableErrors.length === 0) return [];
		const clauses = tableErrors.map((error) => {
			const sexLabel = error.field === "women" ? "de femmes" : "d'hommes";
			return `le total ${sexLabel} ne correspond pas à la référence (${error.expected})`;
		});
		return [
			{
				id: `step4-coherence-${table}`,
				label: `Nombre de salariés (${TABLE_LABEL[table]}) — ${clauses.join(" ; ")}.`,
			},
		];
	});
}
