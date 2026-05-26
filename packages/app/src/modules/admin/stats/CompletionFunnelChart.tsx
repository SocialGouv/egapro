"use client";

import { FunnelChart } from "echarts/charts";
import {
	LegendComponent,
	TitleComponent,
	TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import ReactECharts from "echarts-for-react/lib/core";

import styles from "./CompletionFunnelChart.module.scss";
import type { FunnelRow } from "./types";

echarts.use([
	FunnelChart,
	TooltipComponent,
	TitleComponent,
	LegendComponent,
	CanvasRenderer,
]);

type Props = {
	caption: string;
	rows: FunnelRow[];
	dropThreshold: number;
};

const DEFAULT_BAR_COLOR = "#000091";
const ALERT_BAR_COLOR = "#c9191e";

function formatCount(value: number): string {
	return value.toLocaleString("fr-FR");
}

export function isAboveThreshold(
	pctDropFromPrev: number | null,
	threshold: number,
): boolean {
	return pctDropFromPrev !== null && pctDropFromPrev > threshold;
}

type FunnelDatum = {
	name: string;
	value: number;
	row: FunnelRow;
	itemStyle: { color: string };
};

type TooltipFormatterParams = {
	data: FunnelDatum;
};

type LabelFormatterParams = {
	data: FunnelDatum;
};

export function buildTooltipFormatter(
	dropThreshold: number,
): (params: TooltipFormatterParams) => string {
	return (params) => {
		const { row } = params.data;
		const head =
			`<strong>${row.label}</strong><br/>` +
			`${formatCount(row.count)} déclarations (${row.pctOfStart} % du funnel)`;
		if (row.pctDropFromPrev === null) {
			return head;
		}
		const dropStyle = isAboveThreshold(row.pctDropFromPrev, dropThreshold)
			? "color:#c9191e;font-weight:600;"
			: "";
		return `${head}<br/><span style="${dropStyle}">Chute de ${row.pctDropFromPrev} % vs étape précédente</span>`;
	};
}

function labelFormatter(params: LabelFormatterParams): string {
	const { row } = params.data;
	return `{name|${row.label}}\n{value|${formatCount(row.count)}}\n{pct|${row.pctOfStart} %}`;
}

export function buildEchartsOption(
	rows: FunnelRow[],
	dropThreshold: number,
): echarts.EChartsCoreOption {
	return {
		tooltip: {
			trigger: "item",
			formatter: buildTooltipFormatter(dropThreshold),
		},
		series: [
			{
				type: "funnel",
				orient: "horizontal",
				sort: "none",
				gap: 4,
				width: "92%",
				height: "76%",
				left: "4%",
				top: "8%",
				funnelAlign: "center",
				label: {
					show: true,
					position: "inside",
					color: "#fff",
					formatter: labelFormatter,
					rich: {
						name: {
							fontSize: 13,
							fontWeight: 600,
							padding: [0, 0, 4, 0],
							color: "#fff",
						},
						value: { fontSize: 16, fontWeight: 700, color: "#fff" },
						pct: { fontSize: 12, color: "rgba(255,255,255,0.9)" },
					},
				},
				labelLine: { show: false },
				itemStyle: {
					borderColor: "rgba(255,255,255,0.8)",
					borderWidth: 1,
				},
				data: rows.map<FunnelDatum>((row) => ({
					name: row.label,
					value: row.count,
					row,
					itemStyle: {
						color: isAboveThreshold(row.pctDropFromPrev, dropThreshold)
							? ALERT_BAR_COLOR
							: DEFAULT_BAR_COLOR,
					},
				})),
			},
		],
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

	const option = buildEchartsOption(rows, dropThreshold);

	return (
		<figure className={styles.chartWrapper}>
			<figcaption className="fr-sr-only">
				{caption}. Nombre de déclarations à chaque jalon du funnel, avec le
				pourcentage du funnel et la chute par rapport à l'étape précédente. Les
				données équivalentes sont disponibles dans le tableau ci-dessous.
			</figcaption>
			<div aria-label={caption} className={styles.chartContainer} role="img">
				<ReactECharts
					className={styles.chart}
					echarts={echarts}
					option={option}
					opts={{ renderer: "canvas" }}
				/>
			</div>
		</figure>
	);
}
