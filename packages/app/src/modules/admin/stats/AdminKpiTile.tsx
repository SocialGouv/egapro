import type { ReactNode } from "react";

const NARROW_NBSP = " ";

export type AdminKpiTileDelta = {
	points: number;
	comparisonLabel: string;
};

type Props = {
	title: string;
	value: string;
	subtitle: string;
	delta: AdminKpiTileDelta | null;
	// true when the underlying KPI is "lower is better" (e.g. share above gap threshold).
	inverted?: boolean;
};

type BadgeRendering = {
	className: string;
	arrow: string;
	signedValue: string;
};

function formatPointsAbs(points: number): string {
	const rounded = Math.round(Math.abs(points) * 10) / 10;
	return rounded.toFixed(1).replace(".", ",");
}

export function getBadgeRendering(
	delta: AdminKpiTileDelta,
	inverted: boolean,
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

function renderBadge(
	delta: AdminKpiTileDelta | null,
	inverted: boolean,
): ReactNode {
	if (!delta) return null;
	const { className, arrow, signedValue } = getBadgeRendering(delta, inverted);
	return (
		<p className={className}>
			<span aria-hidden="true">{arrow}</span> {signedValue}
			{NARROW_NBSP}pts {delta.comparisonLabel}
		</p>
	);
}

export function AdminKpiTile({
	title,
	value,
	subtitle,
	delta,
	inverted = false,
}: Props) {
	return (
		<div className="fr-tile fr-tile--vertical fr-tile--no-border">
			<div className="fr-tile__body">
				<div className="fr-tile__content">
					<h3 className="fr-tile__title">{title}</h3>
					<p className="fr-display--xs fr-mb-1w">{value}</p>
					{renderBadge(delta, inverted)}
					<p className="fr-text--sm fr-text-mention--grey fr-mb-0 fr-mt-1w">
						{subtitle}
					</p>
				</div>
			</div>
		</div>
	);
}
