import {
	GAP_FAVORED_SEX_MENTIONS,
	GAP_LEVEL_LABELS,
	gapBadgeClass,
} from "~/modules/declaration-remuneration/shared/gapBadge";
import {
	formatGap,
	gapFavoredSex,
	gapLevel,
	gapMagnitude,
} from "~/modules/domain";
import styles from "./GapValueBadge.module.scss";

type Props = {
	gap: number | null;
};

export function GapBadge({ gap }: Props) {
	if (gap === null) return <span className="fr-text--sm">-</span>;
	const level = gapLevel(gap);
	const favoredSex = gapFavoredSex(gap);
	return (
		<span className={styles.gapCellStack}>
			<span className={`fr-text--sm ${styles.gapCell}`}>
				<strong>{formatGap(gapMagnitude(gap))}</strong>
				{level === "high" && (
					<span className={gapBadgeClass(level)}>
						{GAP_LEVEL_LABELS[level]}
					</span>
				)}
			</span>
			{favoredSex && (
				<span className="fr-text--sm">
					{GAP_FAVORED_SEX_MENTIONS[favoredSex]}
				</span>
			)}
		</span>
	);
}
