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
import stepStyles from "../Step6Review.module.scss";

type Props = {
	gap: number | null;
	/**
	 * "cell" shows the absolute value with the badge to its right, and — unlike
	 * "inline" — the favored-sex mention on a second line (Figma declaration
	 * tables, étapes 2/3/5). "inline" (default) keeps the signed value then
	 * badge together, for the compact recap summary and the second-declaration
	 * review, which stay signed and unmentioned (Figma node 7548-75036).
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
		const favoredSex = gapFavoredSex(gap);
		return (
			<span className={stepStyles.gapCellStack}>
				<span className={`fr-text--sm ${stepStyles.gapCell}`}>
					<strong>{formatGap(gapMagnitude(gap))}</strong>
					{badge}
				</span>
				{favoredSex && (
					<span className="fr-text--sm">
						{GAP_FAVORED_SEX_MENTIONS[favoredSex]}
					</span>
				)}
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
