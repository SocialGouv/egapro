import { formatPointsAbs, NARROW_NBSP } from "~/modules/domain";

export type KpiBadgeDelta = {
	points: number;
	comparisonLabel: string;
};

type BadgeRendering = {
	className: string;
	arrow: string;
	signedValue: string;
};

export function getKpiBadgeRendering(
	delta: KpiBadgeDelta,
	inverted = false,
): BadgeRendering {
	if (delta.points > 0) {
		return {
			className: inverted
				? "fr-badge fr-badge--error fr-badge--no-icon"
				: "fr-badge fr-badge--success fr-badge--no-icon",
			arrow: "↑",
			signedValue: `+${formatPointsAbs(delta.points)}`,
		};
	}
	if (delta.points < 0) {
		return {
			className: inverted
				? "fr-badge fr-badge--success fr-badge--no-icon"
				: "fr-badge fr-badge--error fr-badge--no-icon",
			arrow: "↓",
			signedValue: `-${formatPointsAbs(delta.points)}`,
		};
	}
	return {
		className: "fr-badge fr-badge--no-icon",
		arrow: "=",
		signedValue: `0${NARROW_NBSP}`,
	};
}

type Props = {
	delta: KpiBadgeDelta | null;
	inverted?: boolean;
};

export function KpiBadge({ delta, inverted = false }: Props) {
	if (!delta) return null;
	const { className, arrow, signedValue } = getKpiBadgeRendering(
		delta,
		inverted,
	);
	return (
		<p className={className}>
			<span aria-hidden="true">{arrow}</span> {signedValue}
			{NARROW_NBSP}pts {delta.comparisonLabel}
		</p>
	);
}
