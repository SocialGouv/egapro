/**
 * UI helpers for displaying gap severity badges (DSFR).
 *
 * These are presentation-only: French labels and badge CSS classes
 * for the "low"/"high" gap classification from the domain layer.
 */

import type { GapLevel } from "~/modules/domain";

/** French labels for gap severity levels. */
export const GAP_LEVEL_LABELS: Record<GapLevel, string> = {
	low: "faible",
	high: "élevé",
} as const;

/** Returns the DSFR badge class for a gap severity level. */
export function gapBadgeClass(level: GapLevel): string {
	return level === "low"
		? "fr-badge fr-badge--sm fr-badge--no-icon fr-badge--info"
		: "fr-badge fr-badge--sm fr-badge--no-icon fr-badge--warning";
}
