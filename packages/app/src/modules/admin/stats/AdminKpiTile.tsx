import { formatPointsDelta } from "~/modules/domain";

import styles from "./AdminKpiTile.module.scss";

type DeltaDirection = "up" | "down" | "flat";

type Props = {
	title: string;
	/** Main value, pre-formatted (e.g. "73,4 %"). */
	value: string;
	/** Auxiliary line beneath the value (e.g. "4 213 / 5 738 entreprises"). */
	subtitle?: string;
	/**
	 * Points-of-percentage delta vs. previous period. `null` hides the badge
	 * entirely (no history available).
	 */
	deltaPoints?: number | null;
	/** Label shown after the delta badge (e.g. "vs 2025"). */
	deltaLabel?: string;
	/**
	 * When true, invert the sign→color mapping: a positive delta is rendered
	 * as an error (red) and a negative one as a success (green). Used by KPIs
	 * where a rising value signals degradation (e.g. K8 — Taux d'écart ≥ 5 %).
	 */
	inverted?: boolean;
};

function directionOf(deltaPoints: number): DeltaDirection {
	const rounded = Math.round(deltaPoints * 10) / 10;
	if (rounded > 0) return "up";
	if (rounded < 0) return "down";
	return "flat";
}

function badgeClassFor(direction: DeltaDirection, inverted: boolean): string {
	if (direction === "flat") return "fr-badge fr-badge--info fr-badge--no-icon";
	const positiveClass = "fr-badge fr-badge--success fr-badge--no-icon";
	const negativeClass = "fr-badge fr-badge--error fr-badge--no-icon";
	if (direction === "up") return inverted ? negativeClass : positiveClass;
	return inverted ? positiveClass : negativeClass;
}

function arrowFor(direction: DeltaDirection): string {
	if (direction === "up") return "↑";
	if (direction === "down") return "↓";
	return "=";
}

/**
 * Reusable KPI tile for the admin stats dashboard.
 *
 * Renders a DSFR `fr-tile` with a title, a prominent value, an optional
 * points-delta badge vs. the previous period, and an optional subtitle.
 * Shared across K1 (declaration rate), K8 (gap alert rate) and later KPIs
 * — keep business logic out of here, callers pass pre-formatted strings.
 */
export function AdminKpiTile({
	title,
	value,
	subtitle,
	deltaPoints,
	deltaLabel,
	inverted = false,
}: Props) {
	const direction =
		deltaPoints === null || deltaPoints === undefined
			? null
			: directionOf(deltaPoints);

	return (
		<div className="fr-tile fr-tile--no-icon fr-tile--no-border">
			<div className="fr-tile__body">
				<div className={`fr-tile__content ${styles.tile}`}>
					<h3 className="fr-tile__title">{title}</h3>
					<p className={styles.value}>{value}</p>
					{direction !== null &&
						deltaPoints !== null &&
						deltaPoints !== undefined && (
							<div>
								<p className={badgeClassFor(direction, inverted)}>
									<span aria-hidden="true">{arrowFor(direction)} </span>
									{formatPointsDelta(deltaPoints)}
									{deltaLabel ? ` ${deltaLabel}` : null}
								</p>
							</div>
						)}
					{subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
				</div>
			</div>
		</div>
	);
}
