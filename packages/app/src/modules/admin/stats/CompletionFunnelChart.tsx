"use client";

import styles from "./CompletionFunnelChart.module.scss";
import type { FunnelRow } from "./types";

type Props = {
	caption: string;
	rows: FunnelRow[];
	dropThreshold: number;
};

const DEFAULT_BAR_COLOR = "var(--background-action-high-blue-france)";
const ALERT_BAR_COLOR = "var(--background-action-high-red-marianne)";

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 360;
const TOP_LABEL_AREA = 50;
const BOTTOM_LABEL_AREA = 100;
const DRAW_HEIGHT = VIEW_HEIGHT - TOP_LABEL_AREA - BOTTOM_LABEL_AREA;
const MID_Y = TOP_LABEL_AREA + DRAW_HEIGHT / 2;

function formatCount(value: number): string {
	return value.toLocaleString("fr-FR");
}

function isAboveThreshold(
	pctDropFromPrev: number | null,
	threshold: number,
): boolean {
	return pctDropFromPrev !== null && pctDropFromPrev > threshold;
}

function buildTitle(row: FunnelRow): string {
	const head = `${row.label} : ${formatCount(row.count)} (${row.pctOfStart} % du funnel)`;
	if (row.pctDropFromPrev === null) return head;
	return `${head} — chute de ${row.pctDropFromPrev} % vs étape précédente`;
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

	const maxValue = Math.max(...rows.map((r) => r.count), 1);
	const segmentWidth = VIEW_WIDTH / rows.length;
	const heights = rows.map((r) => (r.count / maxValue) * DRAW_HEIGHT);

	return (
		<figure className={styles.chartWrapper}>
			<figcaption className="fr-sr-only">
				{caption}. Nombre de déclarations à chaque jalon du funnel, avec le
				pourcentage du funnel et la chute par rapport à l'étape précédente. Les
				données équivalentes sont disponibles dans le tableau ci-dessous.
			</figcaption>
			<svg
				aria-label={caption}
				className={styles.chartSvg}
				role="img"
				viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
			>
				{rows.map((row, i) => {
					const xStart = i * segmentWidth;
					const xEnd = xStart + segmentWidth;
					const hLeft = heights[i] ?? 0;
					const hRight =
						i < rows.length - 1 ? (heights[i + 1] ?? 0) : (heights[i] ?? 0);
					const path = `M ${xStart} ${MID_Y - hLeft / 2} L ${xEnd} ${
						MID_Y - hRight / 2
					} L ${xEnd} ${MID_Y + hRight / 2} L ${xStart} ${MID_Y + hLeft / 2} Z`;
					const xMid = xStart + segmentWidth / 2;
					const triggersAlert = isAboveThreshold(
						row.pctDropFromPrev,
						dropThreshold,
					);
					const fill = triggersAlert ? ALERT_BAR_COLOR : DEFAULT_BAR_COLOR;

					return (
						<g key={row.key}>
							<text
								className={styles.topLabel}
								textAnchor="middle"
								x={xMid}
								y={TOP_LABEL_AREA - 16}
							>
								{row.label}
							</text>
							<path d={path} fill={fill}>
								<title>{buildTitle(row)}</title>
							</path>
							<text
								className={styles.countLabel}
								textAnchor="middle"
								x={xMid}
								y={VIEW_HEIGHT - BOTTOM_LABEL_AREA + 28}
							>
								{formatCount(row.count)}
							</text>
							<text
								className={styles.pctLabel}
								textAnchor="middle"
								x={xMid}
								y={VIEW_HEIGHT - BOTTOM_LABEL_AREA + 52}
							>
								{row.pctOfStart} % du funnel
							</text>
							{row.pctDropFromPrev !== null && (
								<text
									className={
										triggersAlert ? styles.dropLabelAlert : styles.dropLabel
									}
									textAnchor="middle"
									x={xMid}
									y={VIEW_HEIGHT - BOTTOM_LABEL_AREA + 76}
								>
									↓ {row.pctDropFromPrev} % vs précédent
								</text>
							)}
						</g>
					);
				})}
			</svg>
		</figure>
	);
}
