// Largest remainder method: the parts always sum back to `total` exactly, which
// independent rounding of each bucket cannot guarantee.
export function distributeByLargestRemainder(
	total: number,
	weights: number[],
): number[] {
	const n = weights.length;
	if (total <= 0) return new Array(n).fill(0) as number[];
	const positive = weights.some((w) => w > 0) ? weights : new Array(n).fill(1);
	const sum = positive.reduce((a, b) => a + b, 0);
	const raw = positive.map((w) => (total * w) / sum);
	const result = raw.map(Math.floor);
	let remaining = total - result.reduce((a, b) => a + b, 0);
	const order = raw
		.map((r, i) => ({ i, frac: r - Math.floor(r) }))
		.sort((a, b) => b.frac - a.frac);
	let k = 0;
	while (remaining > 0) {
		const slot = order[k % n];
		if (slot) result[slot.i] = (result[slot.i] ?? 0) + 1;
		remaining -= 1;
		k += 1;
	}
	return result;
}

export function proportionWomen(women: number, men: number): number {
	return women + men > 0 ? women / (women + men) : 0;
}

export function proportionMen(women: number, men: number): number {
	return women + men > 0 ? men / (women + men) : 0;
}

export function fmt2(n: number): string {
	return n.toFixed(2).replace(".", ",");
}

export function fmt4(n: number): string {
	return n.toFixed(4).replace(".", ",");
}

/**
 * Computes the GIP-style gap from two already-rounded formatted operands
 * (French decimal notation, e.g. "21,16").
 * Returns null if either operand is absent/empty or if H equals zero.
 */
export function gapFromRounded(
	roundedF: string | undefined,
	roundedH: string | undefined,
): number | null {
	if (!roundedF || !roundedH || roundedF === "" || roundedH === "") return null;
	const f = Number.parseFloat(roundedF.replace(",", "."));
	const h = Number.parseFloat(roundedH.replace(",", "."));
	if (Number.isNaN(f) || Number.isNaN(h) || h === 0) return null;
	return (h - f) / h;
}

const ECART_PAIRS: [string, string, string][] = [
	[
		"Rem_globale_annuelle_moyenne_ecart",
		"Rem_globale_annuelle_moyenne_F",
		"Rem_globale_annuelle_moyenne_H",
	],
	[
		"Taux_horaire_global_moyen_ecart",
		"Taux_horaire_global_moyen_F",
		"Taux_horaire_global_moyen_H",
	],
	[
		"Rem_variable_annuelle_moyenne_ecart",
		"Rem_variable_annuelle_moyenne_F",
		"Rem_variable_annuelle_moyenne_H",
	],
	[
		"Taux_horaire_variable_moyen_ecart",
		"Taux_horaire_variable_moyen_F",
		"Taux_horaire_variable_moyen_H",
	],
	[
		"Rem_globale_annuelle_mediane_ecart",
		"Rem_globale_annuelle_mediane_F",
		"Rem_globale_annuelle_mediane_H",
	],
	[
		"Taux_horaire_global_median_ecart",
		"Taux_globale_annuelle_mediane_F",
		"Taux_globale_annuelle_mediane_H",
	],
	[
		"Rem_variable_annuelle_mediane_ecart",
		"Rem_variable_annuelle_mediane_F",
		"Rem_variable_annuelle_mediane_H",
	],
	[
		"Taux_horaire_variable_median_ecart",
		"Taux_horaire_variable_median_F ",
		"Taux_horaire_variable_median_H",
	],
];

/**
 * Re-derives all 8 *_ecart columns from their rounded operand pairs in-place.
 * Skips ecart columns that are already absent/empty — they are intentionally
 * null (e.g. edge cases where the gap is declared non-computable despite
 * operands being present).
 */
export function recomputeEcarts(row: Record<string, string>): void {
	for (const [ecartCol, colF, colH] of ECART_PAIRS) {
		const current = row[ecartCol];
		if (current === undefined || current === "") continue;
		const f = row[colF];
		const h = row[colH];
		if (!f || !h || f === "" || h === "") {
			row[ecartCol] = "";
			continue;
		}
		const gap = gapFromRounded(f, h);
		row[ecartCol] = gap === null ? "" : fmt4(gap);
	}
}
