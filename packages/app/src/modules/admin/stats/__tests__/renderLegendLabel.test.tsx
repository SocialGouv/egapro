import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderLegendLabel } from "../renderLegendLabel";
import {
	RENDERED_CHARTS,
	withMeasurableChartLayout,
} from "./helpers/renderedCharts";

const DSFR_DEFAULT_TEXT_COLOR_CLASS = "fr-text-default--grey";

const CHARTS_WITH_LEGEND = RENDERED_CHARTS.filter(
	({ name }) => name !== "StepDropoffChart",
);

describe("renderLegendLabel", () => {
	it("renders the series name in the DSFR default text colour", () => {
		render(renderLegendLabel("p90 (j)"));

		expect(screen.getByText("p90 (j)")).toHaveClass(
			DSFR_DEFAULT_TEXT_COLOR_CLASS,
		);
	});
});

describe("stats chart legends — readable text whatever the series colour (RGAA 3.2)", () => {
	withMeasurableChartLayout();

	it.each(
		CHARTS_WITH_LEGEND,
	)("$name renders every legend label in the DSFR text colour and keeps the series swatch", ({
		element,
	}) => {
		const { container } = render(element);

		const legendItems = Array.from(
			container.querySelectorAll(".recharts-legend-item"),
		);
		expect(legendItems.length).toBeGreaterThan(0);
		for (const item of legendItems) {
			const label = item.querySelector(".recharts-legend-item-text > span");
			expect(label).toHaveClass(DSFR_DEFAULT_TEXT_COLOR_CLASS);
			expect(label?.textContent).toBeTruthy();

			const seriesColor = item
				.querySelector<HTMLElement>(".recharts-legend-item-text")
				?.style.getPropertyValue("color");
			const swatch = item.querySelector(".recharts-legend-icon");
			expect(seriesColor).toMatch(/^var\(--/);
			expect([
				swatch?.getAttribute("fill"),
				swatch?.getAttribute("stroke"),
			]).toContain(seriesColor);
		}
	});
});
