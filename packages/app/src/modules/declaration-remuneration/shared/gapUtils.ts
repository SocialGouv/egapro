// Domain re-exports (canonical source: ~/modules/domain)
export type { GapLevel } from "~/modules/domain";
export {
	computeGap,
	computePercentage,
	computeProportion,
	computeTotal,
	displayDecimal,
	formatCurrency,
	formatGap,
	formatGapCompact,
	formatTotal,
	gapLevel,
	hasGapsAboveThreshold,
	normalizeDecimalInput,
	parseNumber,
} from "~/modules/domain";

// UI-specific helpers (stay in this module)
export const GAP_LEVEL_LABELS: Record<"low" | "high", string> = {
	low: "faible",
	high: "élevé",
} as const;

export function gapBadgeClass(level: "low" | "high"): string {
	return level === "low"
		? "fr-badge fr-badge--sm fr-badge--no-icon fr-badge--info"
		: "fr-badge fr-badge--sm fr-badge--no-icon fr-badge--warning";
}
