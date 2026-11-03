import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DROPOFF_RATE_ALERT_THRESHOLD } from "~/modules/domain";
import { StepDropoffChart } from "../StepDropoffChart";
import type { StepDropoffRow } from "../types";
import { withMeasurableChartLayout } from "./helpers/renderedCharts";

const BAR_ANIMATION_MS = 2000;

function finishBarAnimation() {
	act(() => {
		vi.advanceTimersByTime(BAR_ANIMATION_MS);
	});
}

function buildRow(
	key: string,
	phase: StepDropoffRow["phase"],
	dropoffRate: number,
): StepDropoffRow {
	return {
		key,
		phase,
		step: phase === "wizard" ? 0 : null,
		label: `Phase ${key}`,
		total: 100,
		abandoned: dropoffRate,
		dropoffRate,
	};
}

describe("StepDropoffChart threshold mark", () => {
	withMeasurableChartLayout();

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("labels every bar with its rate and prefixes only the bars above the threshold with ▲", () => {
		const { container } = render(
			<StepDropoffChart
				rows={[
					buildRow("0", "wizard", DROPOFF_RATE_ALERT_THRESHOLD + 10),
					buildRow("1", "wizard", DROPOFF_RATE_ALERT_THRESHOLD + 0.1),
					buildRow("2", "wizard", DROPOFF_RATE_ALERT_THRESHOLD),
					buildRow("3", "wizard", DROPOFF_RATE_ALERT_THRESHOLD - 10),
				]}
			/>,
		);

		finishBarAnimation();

		const labels = Array.from(
			container.querySelectorAll(".recharts-label-list text"),
			(label) => label.textContent,
		);
		expect(labels).toEqual(["▲ 25,0 %", "▲ 15,1 %", "15,0 %", "5,0 %"]);
	});

	it("keeps the red fill on the same bars the ▲ mark flags", () => {
		const { container } = render(
			<StepDropoffChart
				rows={[
					buildRow("0", "wizard", DROPOFF_RATE_ALERT_THRESHOLD - 1),
					buildRow("1", "wizard", DROPOFF_RATE_ALERT_THRESHOLD + 1),
					buildRow("a", "post_submit", DROPOFF_RATE_ALERT_THRESHOLD - 1),
					buildRow("b", "post_submit", DROPOFF_RATE_ALERT_THRESHOLD + 1),
				]}
			/>,
		);

		finishBarAnimation();

		const fills = Array.from(
			container.querySelectorAll(".recharts-bar-rectangle .recharts-rectangle"),
			(bar) => bar.getAttribute("fill"),
		);
		expect(fills).toEqual([
			"var(--background-action-high-blue-france)",
			"var(--background-action-high-red-marianne)",
			"var(--background-action-low-blue-france)",
			"var(--background-action-low-red-marianne)",
		]);
	});
});
