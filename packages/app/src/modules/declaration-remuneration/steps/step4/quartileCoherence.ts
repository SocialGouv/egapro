import type { QuartileTuple } from "~/modules/declaration-remuneration";
import { QUARTILE_COUNT } from "~/modules/domain";
import { type CountField, TABLE_LABEL, type TableType } from "./quartileErrors";

export type QuartileReference = { women?: number; men?: number };

export type QuartileReferences = {
	annual: QuartileReference;
	hourly: QuartileReference;
};

export type CoherenceWarning = {
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

// Warnings only: the GIP file itself can ship quartile counts that disagree with
// the headcount it declares, so blocking here would trap a declarant in an
// inconsistency they cannot fix. Each table is compared to its own reference
// (annual vs hourly), never to the other one.
export function deriveCoherenceWarnings(
	values: { annual: QuartileTuple; hourly: QuartileTuple },
	references: QuartileReferences,
): CoherenceWarning[] {
	const out: CoherenceWarning[] = [];
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

export function coherenceWarningLabel(warning: CoherenceWarning): string {
	const sexLabel = warning.field === "women" ? "de femmes" : "d'hommes";
	return `Le total des effectifs ${sexLabel} saisis pour la ${TABLE_LABEL[warning.table]} (${warning.total}) ne correspond pas à l'effectif de référence (${warning.expected}).`;
}
