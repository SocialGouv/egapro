import {
	GAP_LEVEL_LABELS,
	gapBadgeClass,
} from "~/modules/declaration-remuneration/shared/gapBadge";
import { formatGap, gapLevel } from "~/modules/domain";
import stepStyles from "../Step6Review.module.scss";

type Props = {
	gap: number | null;
};

/** Displays a formatted gap value with an optional severity badge */
export function GapBadge({ gap }: Props) {
	if (gap === null) return <span className="fr-text--sm">-</span>;
	const level = gapLevel(gap);
	if (!level) return <span className="fr-text--sm">{formatGap(gap)}</span>;
	return (
		<span className={`fr-text--sm ${stepStyles.inlineGap}`}>
			<strong>{formatGap(gap)}</strong>
			{level === "high" && (
				<span className={gapBadgeClass(level)}>{GAP_LEVEL_LABELS[level]}</span>
			)}
		</span>
	);
}
