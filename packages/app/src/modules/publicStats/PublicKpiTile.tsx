import type { ReactNode } from "react";

import { formatPointsAbs } from "~/modules/domain";

const NARROW_NBSP = " ";

export type PublicKpiTileDelta = {
	points: number;
	comparisonLabel: string;
};

type Props = {
	title: string;
	value: string;
	subtitle: string;
	delta: PublicKpiTileDelta | null;
};

type BadgeRendering = {
	className: string;
	arrow: string;
	signedValue: string;
};

export function getBadgeRendering(delta: PublicKpiTileDelta): BadgeRendering {
	if (delta.points > 0) {
		return {
			className: "fr-badge fr-badge--success fr-badge--no-icon",
			arrow: "↑",
			signedValue: `+${formatPointsAbs(delta.points)}`,
		};
	}
	if (delta.points < 0) {
		return {
			className: "fr-badge fr-badge--error fr-badge--no-icon",
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

function renderBadge(delta: PublicKpiTileDelta | null): ReactNode {
	if (!delta) return null;
	const { className, arrow, signedValue } = getBadgeRendering(delta);
	return (
		<p className={className}>
			<span aria-hidden="true">{arrow}</span> {signedValue}
			{NARROW_NBSP}pts {delta.comparisonLabel}
		</p>
	);
}

export function PublicKpiTile({ title, value, subtitle, delta }: Props) {
	return (
		<div className="fr-tile fr-tile--vertical fr-tile--no-border">
			<div className="fr-tile__body">
				<div className="fr-tile__content">
					<h2 className="fr-tile__title">{title}</h2>
					<p className="fr-display--xs fr-mb-1w">{value}</p>
					{renderBadge(delta)}
					<p className="fr-text--sm fr-text-mention--grey fr-mb-0 fr-mt-1w">
						{subtitle}
					</p>
				</div>
			</div>
		</div>
	);
}
