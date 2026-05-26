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

// DSFR illustration palette — light-theme hex values verified against
// packages/app/node_modules/@gouvfr/dsfr/dist/dsfr.css custom properties.
const DSFR_FUNNEL_PALETTE = [
	"#000091", // --blue-france-sun-113-625
	"#465f9d", // --blue-ecume-main-400
	"#417dc4", // --blue-cumulus-main-526
	"#009099", // --green-archipel-main-557
	"#00a95f", // --green-emeraude-main-632
	"#b7a73f", // --green-tilleul-verveine-main-707
] as const;

const ALERT_BAR_COLOR = "#c9191e"; // --red-marianne-425-625 (light)
const LEGEND_TEXT_COLOR = "#3a3a3a";

export function pickFunnelColor(
	index: number,
	pctDropFromPrev: number | null,
	threshold: number,
): string {
	if (isAboveThreshold(pctDropFromPrev, threshold)) {
		return ALERT_BAR_COLOR;
	}
	return DSFR_FUNNEL_PALETTE[index % DSFR_FUNNEL_PALETTE.length] as string;
}

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

export function labelFormatter(params: LabelFormatterParams): string {
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
		legend: {
			show: true,
			orient: "horizontal",
			bottom: 0,
			data: rows.map((row) => row.label),
			textStyle: {
				fontSize: 12,
				color: LEGEND_TEXT_COLOR,
			},
			icon: "rect",
			itemWidth: 18,
			itemHeight: 12,
		},
		series: [
			{
				type: "funnel",
				orient: "horizontal",
				sort: "none",
				gap: 4,
				width: "92%",
				height: "66%",
				left: "4%",
				top: "8%",
				bottom: "20%",
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
				data: rows.map<FunnelDatum>((row, index) => ({
					name: row.label,
					value: row.count,
					row,
					itemStyle: {
						color: pickFunnelColor(index, row.pctDropFromPrev, dropThreshold),
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
