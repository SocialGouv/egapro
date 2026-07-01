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
import { useEffect, useState } from "react";

import { formatCount } from "~/modules/domain";

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

// DSFR illustration palette tokens. ECharts only accepts resolved CSS color
// strings (no `var(--…)`), so we read these from the document at runtime via
// `useDsfrPalette` — the values then follow the DSFR `data-fr-theme` switch
// (light/dark) if it gets enabled, instead of being frozen at build time.
const DSFR_PALETTE_TOKENS = [
	"--blue-france-sun-113-625",
	"--blue-ecume-main-400",
	"--blue-cumulus-main-526",
	"--green-archipel-main-557",
	"--green-emeraude-main-632",
	"--green-tilleul-verveine-main-707",
] as const;

const ALERT_TOKEN = "--red-marianne-425-625";
const LEGEND_TEXT_TOKEN = "--text-mention-grey";

// SSR-safe fallback hex values, mirror the light theme of the DSFR tokens
// above. Used until the client effect resolves the real custom properties,
// and as a graceful degradation if a token is missing at runtime.
const FALLBACK_PALETTE = [
	"#000091",
	"#465f9d",
	"#417dc4",
	"#009099",
	"#00a95f",
	"#b7a73f",
] as const;
const FALLBACK_ALERT = "#c9191e";
const FALLBACK_LEGEND_TEXT = "#666666";

export type DsfrPalette = {
	palette: readonly string[];
	alert: string;
	legendText: string;
};

const FALLBACK_DSFR_PALETTE: DsfrPalette = {
	palette: FALLBACK_PALETTE,
	alert: FALLBACK_ALERT,
	legendText: FALLBACK_LEGEND_TEXT,
};

function readCssVar(token: string, fallback: string): string {
	const value = getComputedStyle(document.documentElement)
		.getPropertyValue(token)
		.trim();
	return value === "" ? fallback : value;
}

function readDsfrPalette(): DsfrPalette {
	return {
		palette: DSFR_PALETTE_TOKENS.map((token, i) =>
			readCssVar(token, FALLBACK_PALETTE[i] as string),
		),
		alert: readCssVar(ALERT_TOKEN, FALLBACK_ALERT),
		legendText: readCssVar(LEGEND_TEXT_TOKEN, FALLBACK_LEGEND_TEXT),
	};
}

// Re-reads the DSFR palette whenever `<html data-fr-theme>` flips. The
// `MutationObserver` is the canonical signal in DSFR — switching scheme via
// the footer modal toggles that exact attribute on `:root`.
function useDsfrPalette(): DsfrPalette {
	const [palette, setPalette] = useState<DsfrPalette>(FALLBACK_DSFR_PALETTE);

	useEffect(() => {
		setPalette(readDsfrPalette());
		const observer = new MutationObserver(() => {
			setPalette(readDsfrPalette());
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-fr-theme"],
		});
		return () => observer.disconnect();
	}, []);

	return palette;
}

export function pickFunnelColor(
	index: number,
	pctDropFromPrev: number | null,
	threshold: number,
	dsfrPalette: DsfrPalette = FALLBACK_DSFR_PALETTE,
): string {
	if (isAboveThreshold(pctDropFromPrev, threshold)) {
		return dsfrPalette.alert;
	}
	const colors = dsfrPalette.palette;
	return colors[index % colors.length] as string;
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
	dsfrPalette: DsfrPalette = FALLBACK_DSFR_PALETTE,
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
			? `color:${dsfrPalette.alert};font-weight:600;`
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
	dsfrPalette: DsfrPalette = FALLBACK_DSFR_PALETTE,
): echarts.EChartsCoreOption {
	return {
		tooltip: {
			trigger: "item",
			formatter: buildTooltipFormatter(dropThreshold, dsfrPalette),
		},
		legend: {
			show: true,
			orient: "horizontal",
			bottom: 0,
			data: rows.map((row) => row.label),
			textStyle: {
				fontSize: 12,
				color: dsfrPalette.legendText,
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
						color: pickFunnelColor(
							index,
							row.pctDropFromPrev,
							dropThreshold,
							dsfrPalette,
						),
					},
				})),
			},
		],
	};
}

export function CompletionFunnelChart({ caption, rows, dropThreshold }: Props) {
	const dsfrPalette = useDsfrPalette();
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

	const option = buildEchartsOption(rows, dropThreshold, dsfrPalette);

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
