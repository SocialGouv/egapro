"use client";

import type { FunnelPartWithHandlers } from "@nivo/funnel";
import { ResponsiveFunnel } from "@nivo/funnel";

import styles from "./CompletionFunnelChart.module.scss";
import type { FunnelRow } from "./types";

type Props = {
	caption: string;
	rows: FunnelRow[];
	dropThreshold: number;
};

// Hardcoded DSFR light-theme hex values for @nivo/funnel — its colors prop
// does not evaluate `var(--…)` CSS variables (it routes data through its own
// d3 colour scale). Sources :
//  - --background-action-high-blue-france  → --blue-france-sun-113-625 → #000091
//  - --background-action-high-red-marianne → --red-marianne-425-625    → #c9191e
const DEFAULT_BAR_COLOR = "#000091";
const ALERT_BAR_COLOR = "#c9191e";

// nivo's FunnelDatum requires extra fields to be string | number — we serialize
// `pctDropFromPrev` (which can be null on the first jalon) via -1 sentinel.
const NO_DROP_SENTINEL = -1;

type NivoDatum = {
	id: string;
	value: number;
	label: string;
	rowCount: number;
	rowPctOfStart: number;
	rowPctDropFromPrev: number;
};

function formatCount(value: number): string {
	return value.toLocaleString("fr-FR");
}

function isAboveThreshold(pctDropFromPrev: number, threshold: number): boolean {
	return pctDropFromPrev !== NO_DROP_SENTINEL && pctDropFromPrev > threshold;
}

type FunnelTooltipProps = {
	part: FunnelPartWithHandlers<NivoDatum>;
	dropThreshold: number;
};

export function FunnelTooltip({ part, dropThreshold }: FunnelTooltipProps) {
	const datum = part.data;
	const hasDrop = datum.rowPctDropFromPrev !== NO_DROP_SENTINEL;
	const triggersAlert = isAboveThreshold(
		datum.rowPctDropFromPrev,
		dropThreshold,
	);
	return (
		<div className="fr-p-2w fr-background-alt--grey">
			<p className="fr-text--sm fr-text--bold fr-mb-1w">{datum.label}</p>
			<ul className={styles.tooltipList}>
				<li className={styles.tooltipItem}>
					{formatCount(datum.rowCount)} déclarations ({datum.rowPctOfStart} % du
					funnel)
				</li>
				{hasDrop && (
					<li
						className={
							triggersAlert ? styles.tooltipItemAlert : styles.tooltipItem
						}
					>
						Chute de {datum.rowPctDropFromPrev} % vs étape précédente
					</li>
				)}
			</ul>
		</div>
	);
}

export function buildColorAccessor(dropThreshold: number) {
	return (datum: NivoDatum): string =>
		isAboveThreshold(datum.rowPctDropFromPrev, dropThreshold)
			? ALERT_BAR_COLOR
			: DEFAULT_BAR_COLOR;
}

export function formatFunnelValue(value: number): string {
	return formatCount(value);
}

export function buildTooltipRenderer(dropThreshold: number) {
	return function TooltipRenderer(props: {
		part: FunnelPartWithHandlers<NivoDatum>;
	}) {
		return <FunnelTooltip dropThreshold={dropThreshold} part={props.part} />;
	};
}

function toNivoDatum(row: FunnelRow): NivoDatum {
	return {
		id: row.key,
		value: row.count,
		label: row.label,
		rowCount: row.count,
		rowPctOfStart: row.pctOfStart,
		rowPctDropFromPrev: row.pctDropFromPrev ?? NO_DROP_SENTINEL,
	};
}

export function CompletionFunnelChart({ caption, rows, dropThreshold }: Props) {
	const hasData = rows.some((row) => row.count > 0);
	if (!hasData) {
		return (
			<p
				aria-live="polite"
				className="fr-text--sm fr-text-mention--grey fr-mt-2w"
			>
				Aucune donnée pour ces filtres.
			</p>
		);
	}

	const data = rows.map(toNivoDatum);

	return (
		<figure className={styles.chartWrapper}>
			<figcaption className="fr-sr-only">
				{caption}. Nombre de déclarations à chaque jalon du funnel, avec le
				pourcentage du funnel et la chute par rapport à l'étape précédente. Les
				données équivalentes sont disponibles dans le tableau ci-dessous.
			</figcaption>
			<div aria-label={caption} className={styles.chartContainer} role="img">
				<ResponsiveFunnel<NivoDatum>
					borderColor={{ from: "color", modifiers: [["darker", 0.5]] }}
					borderWidth={20}
					colors={buildColorAccessor(dropThreshold)}
					data={data}
					direction="horizontal"
					labelColor={{ from: "color", modifiers: [["darker", 3]] }}
					margin={{ top: 30, right: 30, bottom: 60, left: 30 }}
					motionConfig="gentle"
					tooltip={buildTooltipRenderer(dropThreshold)}
					valueFormat={formatFunnelValue}
				/>
			</div>
		</figure>
	);
}
