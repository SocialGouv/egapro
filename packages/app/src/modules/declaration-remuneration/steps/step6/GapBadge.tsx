import {
	GAP_LEVEL_LABELS,
	formatGap,
	gapBadgeClass,
	gapLevel,
} from "../../shared/gapUtils";
import stepStyles from "../Step6Review.module.scss";

type Props = {
	gap: number | null;
};

/** Displays a formatted gap value with an optional severity badge */
export function GapBadge({ gap }: Props) {
	if (gap === null) return <span>-</span>;
	const level = gapLevel(gap);
	if (!level) return <span>{formatGap(gap)}</span>;
	return (
		<span className={stepStyles.inlineGap}>
			<strong>{formatGap(gap)}</strong>
			<span className={gapBadgeClass(level)}>{GAP_LEVEL_LABELS[level]}</span>
		</span>
	);
}
