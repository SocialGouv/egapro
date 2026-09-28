import type { QuartileTuple } from "~/modules/declaration-remuneration";
import { QUARTILE_COUNT } from "~/modules/domain";
import type { CountField, TableType } from "./quartileErrors";

export type QuartileReference = { women?: number; men?: number };

export type QuartileReferences = {
	annual: QuartileReference;
	hourly: QuartileReference;
};

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

// Each table is held to the step 1 headcount declared for its own pay basis,
// never to the GIP file nor to the other basis.
export function deriveCoherenceErrors(
	values: { annual: QuartileTuple; hourly: QuartileTuple },
	references: QuartileReferences,
): CoherenceError[] {
	const out: CoherenceError[] = [];
	for (const table of ["annual", "hourly"] as const) {
		for (const field of ["women", "men"] as const) {
			const expected = references[table][field];
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
