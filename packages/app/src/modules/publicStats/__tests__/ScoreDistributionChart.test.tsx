import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { ScoreDistributionBracket } from "../ScoreDistributionChart";

type RechartsTooltipModule = typeof import("recharts");

vi.mock("recharts", async () => {
	const actual = await vi.importActual<RechartsTooltipModule>("recharts");
	return {
		...actual,
		ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", { "data-testid": "responsive" }, children),
	};
});

import {
	ChartTooltip,
	formatYAxisTick,
	ScoreDistributionChart,
} from "../ScoreDistributionChart";

const baseBrackets: ScoreDistributionBracket[] = [
	{ id: "lt50", label: "<50", count: 12, percentage: 1.5 },
	{ id: "50-59", label: "50-59", count: 50, percentage: 6.3 },
	{ id: "60-69", label: "60-69", count: 100, percentage: 12.5 },
	{ id: "70-79", label: "70-79", count: 150, percentage: 18.8 },
	{ id: "80-89", label: "80-89", count: 200, percentage: 25 },
	{ id: "90-99", label: "90-99", count: 230, percentage: 28.8 },
	{ id: "100", label: "100", count: 50, percentage: 6.3 },
	{ id: "nc", label: "NC", count: 8, percentage: 1 },
];

describe("ScoreDistributionChart", () => {
	it("renders a Recharts container with the bracket dataset", () => {
		const { container } = render(
			<ScoreDistributionChart brackets={baseBrackets} />,
		);
		expect(screen.getByTestId("responsive")).toBeInTheDocument();
		expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
	});

	it("hides the chart from assistive tech (alternative table provides the data)", () => {
		const { container } = render(
			<ScoreDistributionChart brackets={baseBrackets} />,
		);
		const wrapper = container.querySelector("[aria-hidden='true']");
		expect(wrapper).toHaveAttribute("role", "presentation");
	});

	it("renders even with an empty dataset (defensive)", () => {
		const { container } = render(<ScoreDistributionChart brackets={[]} />);
		expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
	});
});

describe("ChartTooltip", () => {
	it("returns null when inactive", () => {
		const { container } = render(
			<ChartTooltip active={false} payload={[{ payload: baseBrackets[0] }]} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("returns null when payload is missing", () => {
		const { container } = render(<ChartTooltip active={true} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("returns null when payload is empty", () => {
		const { container } = render(<ChartTooltip active={true} payload={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("returns null when the payload entry has no datum", () => {
		const { container } = render(<ChartTooltip active={true} payload={[{}]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders the plural noun and the verbatim tooltip format for multi-entry buckets", () => {
		render(
			<ChartTooltip
				active={true}
				payload={[
					{
						payload: {
							id: "80-89",
							label: "80-89",
							count: 230,
							percentage: 28.8,
						},
					},
				]}
			/>,
		);
		expect(screen.getByText(/230\s+entreprises/)).toBeInTheDocument();
		expect(screen.getByText(/tranche 80-89/)).toBeInTheDocument();
		expect(screen.getByText(/28,8/)).toBeInTheDocument();
	});

	it("uses the singular noun when the bucket contains exactly one company", () => {
		render(
			<ChartTooltip
				active={true}
				payload={[
					{ payload: { id: "100", label: "100", count: 1, percentage: 0.5 } },
				]}
			/>,
		);
		expect(screen.getByText(/1\s+entreprise(?!s)/)).toBeInTheDocument();
	});

	it("renders '0 entreprise' (French convention: 0 takes the singular)", () => {
		render(
			<ChartTooltip
				active={true}
				payload={[
					{ payload: { id: "nc", label: "NC", count: 0, percentage: 0 } },
				]}
			/>,
		);
		expect(screen.getByText(/0\s+entreprise(?!s)/)).toBeInTheDocument();
	});
});

describe("formatYAxisTick", () => {
	it("formats integers using the French locale (narrow-no-break-space thousands)", () => {
		expect(formatYAxisTick(1234)).toMatch(/1.234/);
	});

	it("formats zero as '0'", () => {
		expect(formatYAxisTick(0)).toBe("0");
	});
});
