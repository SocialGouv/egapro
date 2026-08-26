"use client";

import ReactECharts from "echarts-for-react";
import type { PublicDeclarationDTO } from "~/modules/public-api";

type Props = { declarations: PublicDeclarationDTO[] };

type HistoryDeclaration = Pick<
	PublicDeclarationDTO,
	| "year"
	| "globalAnnualMeanGap"
	| "globalHourlyMeanGap"
	| "variableAnnualMeanGap"
>;

export function buildHistoryChartOption(declarations: HistoryDeclaration[]) {
	const sorted = [...declarations].sort((a, b) => a.year - b.year);
	const percent = (value: number | null) =>
		value === null ? null : value * 100;

	return {
		animation: false,
		aria: { enabled: false },
		color: ["#000091", "#009099", "#6a6af4"],
		tooltip: {
			trigger: "axis",
			valueFormatter: (value: unknown) =>
				typeof value === "number"
					? `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`
					: "—",
		},
		legend: { type: "scroll", bottom: 0, left: 16, right: 16 },
		grid: { left: 56, right: 24, top: 24, bottom: 88 },
		xAxis: { type: "category", data: sorted.map((item) => item.year) },
		yAxis: { type: "value", axisLabel: { formatter: "{value} %" } },
		series: [
			{
				name: "Rémunération annuelle moyenne",
				type: "line",
				symbol: "circle",
				lineStyle: { type: "solid", width: 3 },
				data: sorted.map((item) => percent(item.globalAnnualMeanGap)),
			},
			{
				name: "Taux horaire moyen",
				type: "line",
				symbol: "rect",
				lineStyle: { type: "dashed", width: 3 },
				data: sorted.map((item) => percent(item.globalHourlyMeanGap)),
			},
			{
				name: "Rémunération variable annuelle",
				type: "line",
				symbol: "triangle",
				lineStyle: { type: "dotted", width: 3 },
				data: sorted.map((item) => percent(item.variableAnnualMeanGap)),
			},
		],
	};
}

export function HistoryChart({ declarations }: Props) {
	return (
		<div aria-hidden="true">
			<ReactECharts
				option={buildHistoryChartOption(declarations)}
				style={{ height: "24.375rem" }}
			/>
		</div>
	);
}
