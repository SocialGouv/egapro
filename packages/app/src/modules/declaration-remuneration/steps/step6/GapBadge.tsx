import {
	GAP_LEVEL_LABELS,
	gapBadgeClass,
} from "~/modules/declaration-remuneration/shared/gapBadge";
import { formatGap, gapLevel } from "~/modules/domain";
import stepStyles from "../Step6Review.module.scss";

type Props = {
	gap: number | null;
	/**
	 * "cell" pins the value to the right of a bordered grid cell with the badge
	 * at the far left (Figma declaration tables). "inline" (default) keeps the
	 * value then badge together, for the compact recap summary.
	 */
	layout?: "inline" | "cell";
};

/** Displays a formatted gap value with an optional severity badge */
export function GapBadge({ gap, layout = "inline" }: Props) {
	if (gap === null) return <span className="fr-text--sm">-</span>;
	const level = gapLevel(gap);
	if (!level) return <span className="fr-text--sm">{formatGap(gap)}</span>;
	const badge =
		level === "high" ? (
			<span className={gapBadgeClass(level)}>{GAP_LEVEL_LABELS[level]}</span>
		) : null;
	if (layout === "cell") {
		return (
			<span className={`fr-text--sm ${stepStyles.gapCell}`}>
				{badge}
				<strong className={stepStyles.gapValue}>{formatGap(gap)}</strong>
			</span>
		);
	}
	return (
		<span className={`fr-text--sm ${stepStyles.inlineGap}`}>
			<strong>{formatGap(gap)}</strong>
			{badge}
		</span>
	);
}
