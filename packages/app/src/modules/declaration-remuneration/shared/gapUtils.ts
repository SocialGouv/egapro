// Shared computation utilities for the declaration-remuneration module.

export type GapLevel = "low" | "high";

export const GAP_LEVEL_LABELS: Record<GapLevel, string> = {
	low: "faible",
	high: "élevé",
} as const;

export function parseNumber(value: string): number {
	return Number.parseFloat(value.replace(/\s/g, "").replace(",", "."));
}

export function computeGap(womenVal: string, menVal: string): number | null {
	const w = parseNumber(womenVal);
	const m = parseNumber(menVal);
	if (!w || !m || m === 0) return null;
	return Math.abs(((m - w) / m) * 100);
}

export function formatGap(gap: number | null): string {
	if (gap === null) return "-";
	return `${gap.toFixed(1).replace(".", ",")} %`;
}

export function formatGapCompact(gap: number | null): string {
	if (gap === null) return "-";
	return gap.toFixed(1).replace(".", ",");
}

export function gapLevel(gap: number | null): GapLevel | null {
	if (gap === null) return null;
	return gap < 5 ? "low" : "high";
}

export function gapBadgeClass(level: GapLevel): string {
	return level === "low"
		? "fr-badge fr-badge--sm fr-badge--no-icon fr-badge--info"
		: "fr-badge fr-badge--sm fr-badge--no-icon fr-badge--warning";
}

export function computeProportion(count: string, total?: number): string {
	const n = Number.parseInt(count, 10);
	if (Number.isNaN(n) || !total || total === 0) return "-";
	return `${((n / total) * 100).toFixed(1).replace(".", ",")} %`;
}

export function formatCurrency(value?: string): string {
	if (!value) return "-";
	const n = Number.parseFloat(value);
	if (Number.isNaN(n)) return "-";
	return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export function computePercentage(count: number, total: number): string {
	if (total === 0) return "-";
	return `${((count / total) * 100).toFixed(1).replace(".", ",")} %`;
}

export function computeTotal(base: string, variable: string): number | null {
	const b = Number.parseFloat(base);
	const v = Number.parseFloat(variable);
	if (Number.isNaN(b) && Number.isNaN(v)) return null;
	return (Number.isNaN(b) ? 0 : b) + (Number.isNaN(v) ? 0 : v);
}

export function formatTotal(value: number | null, unit: string): string {
	if (value === null) return "-";
	return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}`;
}
