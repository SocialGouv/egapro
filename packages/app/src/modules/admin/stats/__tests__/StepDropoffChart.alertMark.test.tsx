import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DROPOFF_RATE_ALERT_THRESHOLD } from "~/modules/domain";
import type { StepDropoffRow } from "../types";

type LabelFormatter = (value: unknown) => string;

// Recharts never mounts under jsdom (no layout): capture the bar label
// formatter and the per-bar fills instead of reading the SVG.
let capturedLabelFormatter: LabelFormatter | undefined;
let capturedLabelDataKey: string | undefined;
const capturedCellFills: string[] = [];

beforeEach(() => {
	capturedLabelFormatter = undefined;
	capturedLabelDataKey = undefined;
	capturedCellFills.length = 0;
});

vi.mock("recharts", () => ({
	ResponsiveContainer: ({ children }: { children: ReactElement }) => children,
	BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	Bar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CartesianGrid: () => null,
	Tooltip: () => null,
	XAxis: () => null,
	YAxis: () => null,
	Cell: ({ fill }: { fill: string }) => {
		capturedCellFills.push(fill);
		return null;
	},
	LabelList: ({
		dataKey,
		formatter,
	}: {
		dataKey: string;
		formatter: LabelFormatter;
	}) => {
		capturedLabelDataKey = dataKey;
		capturedLabelFormatter = formatter;
		return null;
	},
}));

const { StepDropoffChart } = await import("../StepDropoffChart");

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
	it("labels every bar with its rate and prefixes only the bars above the threshold with ▲", () => {
		render(<StepDropoffChart rows={[buildRow("0", "wizard", 25)]} />);
		expect(capturedLabelDataKey).toBe("dropoffRate");
		const format = capturedLabelFormatter;
		if (!format) throw new Error("LabelList formatter was not rendered");

		expect(format(DROPOFF_RATE_ALERT_THRESHOLD + 10)).toBe("▲ 25,0 %");
		expect(format(DROPOFF_RATE_ALERT_THRESHOLD + 0.1)).toMatch(/^▲ /);
		expect(format(DROPOFF_RATE_ALERT_THRESHOLD)).toBe("15,0 %");
		expect(format(DROPOFF_RATE_ALERT_THRESHOLD - 10)).toBe("5,0 %");
		expect(format(undefined)).toBe("");
	});

	it("keeps the red fill on the same bars the ▲ mark flags", () => {
		render(
			<StepDropoffChart
				rows={[
					buildRow("0", "wizard", DROPOFF_RATE_ALERT_THRESHOLD - 1),
					buildRow("1", "wizard", DROPOFF_RATE_ALERT_THRESHOLD + 1),
					buildRow("a", "post_submit", DROPOFF_RATE_ALERT_THRESHOLD - 1),
					buildRow("b", "post_submit", DROPOFF_RATE_ALERT_THRESHOLD + 1),
				]}
			/>,
		);
		expect(capturedCellFills).toEqual([
			"var(--background-action-high-blue-france)",
			"var(--background-action-high-red-marianne)",
			"var(--background-action-low-blue-france)",
			"var(--background-action-low-red-marianne)",
		]);
	});
});
