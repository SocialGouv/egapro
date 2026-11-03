import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { Bar, BarChart } from "recharts";
import { describe, expect, it } from "vitest";

import {
	CHART_HEIGHT,
	CHART_WIDTH,
	RENDERED_CHARTS,
	withMeasurableChartLayout,
} from "./helpers/renderedCharts";

const RECHARTS_DATA = [{ label: "Ordinateur", count: 3 }];

const RECHARTS_WRAPPER_MODES: { mode: string; element: ReactElement }[] = [
	{
		mode: "fixed size",
		element: (
			<BarChart data={RECHARTS_DATA} height={CHART_HEIGHT} width={CHART_WIDTH}>
				<Bar dataKey="count" />
			</BarChart>
		),
	},
	{
		mode: "size read once from the DOM",
		element: (
			<BarChart data={RECHARTS_DATA} height={CHART_HEIGHT} width="100%">
				<Bar dataKey="count" />
			</BarChart>
		),
	},
	{
		mode: "responsive",
		element: (
			<BarChart
				data={RECHARTS_DATA}
				height={CHART_HEIGHT}
				responsive
				width={CHART_WIDTH}
			>
				<Bar dataKey="count" />
			</BarChart>
		),
	},
];

describe("stats charts — no presentation attribute on divs (RGAA 10.1)", () => {
	withMeasurableChartLayout();

	it.each(
		RENDERED_CHARTS,
	)("$name renders no width/height attribute on any div and keeps its size in style", ({
		element,
	}) => {
		const { container } = render(element);

		const wrapper = container.querySelector<HTMLElement>(".recharts-wrapper");
		expect(wrapper?.querySelector("svg.recharts-surface")).not.toBeNull();
		expect(container.querySelectorAll("div[width], div[height]")).toHaveLength(
			0,
		);
		expect(wrapper?.style.width).toBe(`${CHART_WIDTH}px`);
		expect(wrapper?.style.height).toBe(`${CHART_HEIGHT}px`);
	});

	it.each(
		RECHARTS_WRAPPER_MODES,
	)("Recharts wrapper in $mode mode renders no width/height attribute on its div", ({
		element,
	}) => {
		const { container } = render(element);

		expect(container.querySelector(".recharts-wrapper")).not.toBeNull();
		expect(container.querySelectorAll("div[width], div[height]")).toHaveLength(
			0,
		);
	});
});
