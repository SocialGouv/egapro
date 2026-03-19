import type { PayGapRow } from "../types";

export function rowsToCategories(rows: PayGapRow[]) {
	return rows.map((r) => ({
		name: r.label,
		womenValue: r.womenValue,
		menValue: r.menValue,
	}));
}

export function categoriesToRows(
	categories: { name?: string; womenValue?: string; menValue?: string }[],
): PayGapRow[] {
	return categories.map((c) => ({
		label: c.name ?? "",
		womenValue: c.womenValue ?? "",
		menValue: c.menValue ?? "",
	}));
}
