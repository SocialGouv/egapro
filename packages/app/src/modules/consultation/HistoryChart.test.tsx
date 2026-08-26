import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { PublicDeclarationDTO } from "~/modules/public-api";

vi.mock("echarts-for-react", () => ({
	default: ({
		option,
		style,
	}: {
		option: unknown;
		style: React.CSSProperties;
	}) =>
		React.createElement("div", {
			"data-testid": "history-chart",
			"data-option": JSON.stringify(option),
			style,
		}),
}));

import { buildHistoryChartOption, HistoryChart } from "./HistoryChart";

type ChartDeclaration = Pick<
	PublicDeclarationDTO,
	| "year"
	| "globalAnnualMeanGap"
	| "globalHourlyMeanGap"
	| "variableAnnualMeanGap"
>;

const declarations: ChartDeclaration[] = [
	{
		year: 2024,
		globalAnnualMeanGap: 0.012,
		globalHourlyMeanGap: -0.02,
		variableAnnualMeanGap: null,
	},
	{
		year: 2022,
		globalAnnualMeanGap: 0.08,
		globalHourlyMeanGap: 0.055,
		variableAnnualMeanGap: 0.1,
	},
	{
		year: 2023,
		globalAnnualMeanGap: 0.045,
		globalHourlyMeanGap: 0.03,
		variableAnnualMeanGap: 0,
	},
];

describe("HistoryChart", () => {
	it("sorts years, converts ratios to percentages and preserves missing values", () => {
		const option = buildHistoryChartOption(declarations);

		expect(option.xAxis.data).toEqual([2022, 2023, 2024]);
		expect(option.series.map((series) => series.data)).toEqual([
			[8, 4.5, 1.2],
			[5.5, 3, -2],
			[10, 0, null],
		]);
	});

	it("uses a mobile-safe scrollable legend and non-color line distinctions", () => {
		const option = buildHistoryChartOption(declarations);

		expect(option.legend.type).toBe("scroll");
		expect(option.series.map((series) => series.symbol)).toEqual([
			"circle",
			"rect",
			"triangle",
		]);
		expect(option.series.map((series) => series.lineStyle.type)).toEqual([
			"solid",
			"dashed",
			"dotted",
		]);
		expect(option.tooltip.valueFormatter(-2)).toBe("-2 %");
		expect(option.tooltip.valueFormatter(null)).toBe("—");
	});

	it("keeps the graphical canvas out of the accessibility tree", () => {
		render(
			<HistoryChart declarations={declarations as PublicDeclarationDTO[]} />,
		);

		expect(screen.getByTestId("history-chart").parentElement).toHaveAttribute(
			"aria-hidden",
			"true",
		);
		expect(screen.getByTestId("history-chart")).toHaveStyle({
			height: "24.375rem",
		});
	});
});
