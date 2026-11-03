import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	CHART_HEIGHT,
	CHART_WIDTH,
	RENDERED_CHARTS,
	withMeasurableChartLayout,
} from "./helpers/renderedCharts";

describe("stats charts — no keyboard layer inside the chart image (RGAA 7.1)", () => {
	withMeasurableChartLayout();

	it.each(
		RENDERED_CHARTS,
	)("$name renders no role=application nor tab stop inside the chart", ({
		element,
	}) => {
		const { container } = render(element);

		const chartImage = container.querySelector('[role="img"]');
		expect(chartImage?.querySelector("svg.recharts-surface")).not.toBeNull();
		expect(chartImage?.querySelector('[role="application"]')).toBeNull();
		expect(
			chartImage?.querySelector('[tabindex]:not([tabindex="-1"])'),
		).toBeNull();
	});

	it.each(RENDERED_CHARTS)("$name stays announced as a named image", ({
		element,
	}) => {
		const { container } = render(element);

		const chartImage = container.querySelector('[role="img"]');
		expect(chartImage).not.toBeNull();
		expect(chartImage?.getAttribute("aria-label")).toBeTruthy();
		expect(chartImage).toHaveAccessibleName();
	});

	it("keeps the mouse hover tooltip", async () => {
		const durationsChart = RENDERED_CHARTS.find(
			(chart) => chart.name === "StepDurationsChart",
		);
		const { container } = render(durationsChart?.element);

		const wrapper = container.querySelector(".recharts-wrapper");
		expect(wrapper).not.toBeNull();
		fireEvent.mouseMove(wrapper as Element, {
			clientX: CHART_WIDTH / 2,
			clientY: CHART_HEIGHT / 4,
		});

		await waitFor(() =>
			expect(screen.getByText(/Étape « Effectifs »/)).toBeInTheDocument(),
		);
	});
});
