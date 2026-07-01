import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { cloneElement, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import type { CampaignProgressionSeries } from "../types";

type TooltipContentProps = {
	active?: boolean;
	label?: string | number;
	payload?: Array<{ name?: string | number; value?: number }>;
};

// Recharts never mounts under jsdom (no layout), so drive the internals directly:
// render the Tooltip `content` with a controlled active payload, invoke the
// axis `tickFormatter`s and record each Line's stroke, mirroring how
// ScoreDistributionChart is tested.
let capturedYAxisTickFormatter: ((value: number) => string) | undefined;
let capturedXAxisTickFormatter: ((value: string) => string) | undefined;
const capturedLineStrokes: Record<string, string> = {};
const tooltipProbe: TooltipContentProps = {};

vi.mock("recharts", () => ({
	ResponsiveContainer: ({ children }: { children: ReactElement }) => children,
	LineChart: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="line-chart">{children}</div>
	),
	CartesianGrid: () => null,
	Legend: () => null,
	Line: ({ name, stroke }: { name: string; stroke: string }) => {
		capturedLineStrokes[name] = stroke;
		return null;
	},
	XAxis: ({ tickFormatter }: { tickFormatter?: (value: string) => string }) => {
		capturedXAxisTickFormatter = tickFormatter;
		return null;
	},
	YAxis: ({ tickFormatter }: { tickFormatter?: (value: number) => string }) => {
		capturedYAxisTickFormatter = tickFormatter;
		return null;
	},
	Tooltip: ({ content }: { content: ReactElement<TooltipContentProps> }) =>
		isValidElement(content)
			? cloneElement(content, {
					active: tooltipProbe.active,
					label: tooltipProbe.label,
					payload: tooltipProbe.payload,
				})
			: null,
}));

const { CampaignProgressionChart } = await import(
	"../CampaignProgressionChart"
);

const SERIES: CampaignProgressionSeries[] = [
	{
		year: 2025,
		points: [
			{ day: "2025-02-10", cumulative: 40 },
			{ day: "2025-02-15", cumulative: 200 },
		],
	},
	{
		year: 2026,
		points: [
			{ day: "2026-02-12", cumulative: 30 },
			{ day: "2026-02-15", cumulative: 7842 },
		],
	},
];

function renderWithTooltip(
	probe: TooltipContentProps,
	series: CampaignProgressionSeries[] = SERIES,
) {
	Object.assign(tooltipProbe, {
		active: undefined,
		label: undefined,
		payload: undefined,
		...probe,
	});
	return render(
		<CampaignProgressionChart currentYear={2026} series={series} />,
	);
}

describe("CampaignProgressionChart", () => {
	it("shows an empty state when no series produce any day", () => {
		render(<CampaignProgressionChart currentYear={2026} series={[]} />);
		expect(screen.getByText(/Aucune donnée/)).toBeInTheDocument();
	});

	it("renders an accessible figcaption alongside the chart", () => {
		const { container } = renderWithTooltip({});
		expect(container.querySelector("figure")).not.toBeNull();
		expect(container.querySelector("figcaption")?.textContent).toMatch(
			/progression cumulative/i,
		);
	});
});

describe("CampaignProgressionChart Y axis", () => {
	it("formats ticks identically to the French locale (iso-render)", () => {
		renderWithTooltip({});
		expect(capturedYAxisTickFormatter?.(7842)).toBe(
			(7842).toLocaleString("fr-FR"),
		);
	});

	it("formats zero as '0'", () => {
		renderWithTooltip({});
		expect(capturedYAxisTickFormatter?.(0)).toBe("0");
	});
});

describe("CampaignProgressionChart X axis", () => {
	it("formats MM-DD ticks as a day/month label", () => {
		renderWithTooltip({});
		expect(capturedXAxisTickFormatter?.("02-15")).toBe("15/02");
	});
});

describe("CampaignProgressionChart line colors", () => {
	it("draws the current year, the previous year and older years each with its own color", () => {
		renderWithTooltip({}, [
			{ year: 2024, points: [{ day: "2024-02-15", cumulative: 10 }] },
			{ year: 2025, points: [{ day: "2025-02-15", cumulative: 20 }] },
			{ year: 2026, points: [{ day: "2026-02-15", cumulative: 30 }] },
		]);
		expect(capturedLineStrokes["2026"]).not.toBe(capturedLineStrokes["2025"]);
		expect(capturedLineStrokes["2025"]).not.toBe(capturedLineStrokes["2024"]);
		expect(capturedLineStrokes["2026"]).not.toBe(capturedLineStrokes["2024"]);
	});
});

describe("CampaignProgressionChart tooltip", () => {
	it("renders nothing when inactive", () => {
		renderWithTooltip({
			active: false,
			label: "02-15",
			payload: [{ name: "2026", value: 7842 }],
		});
		expect(screen.queryAllByRole("listitem")).toHaveLength(0);
	});

	it("renders nothing when the payload is empty", () => {
		renderWithTooltip({ active: true, label: "02-15", payload: [] });
		expect(screen.queryAllByRole("listitem")).toHaveLength(0);
	});

	it("renders nothing when the label is not a string", () => {
		renderWithTooltip({
			active: true,
			label: 42,
			payload: [{ name: "2026", value: 7842 }],
		});
		expect(screen.queryAllByRole("listitem")).toHaveLength(0);
	});

	it("formats the count and the rounded share of the year total", () => {
		renderWithTooltip({
			active: true,
			label: "02-15",
			payload: [
				{ name: "2025", value: 200 },
				{ name: "2026", value: 7842 },
			],
		});
		expect(
			screen.getByText(/7 842 déclarations \(100 % du total\)/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/2025 : 200 déclarations \(100 % du total\)/),
		).toBeInTheDocument();
	});

	it("rounds the share to the nearest integer", () => {
		renderWithTooltip({
			active: true,
			label: "02-12",
			// 30 / 7842 total ≈ 0.38 % -> rounds to 0 %
			payload: [{ name: "2026", value: 30 }],
		});
		expect(
			screen.getByText(/30 déclarations \(0 % du total\)/),
		).toBeInTheDocument();
	});

	it("falls back to 0 % when the year has no known total", () => {
		renderWithTooltip({
			active: true,
			label: "02-15",
			payload: [{ name: "2099", value: 5 }],
		});
		expect(
			screen.getByText(/5 déclarations \(0 % du total\)/),
		).toBeInTheDocument();
	});

	it("treats a year with no data points as a zero total", () => {
		renderWithTooltip(
			{
				active: true,
				label: "02-15",
				payload: [{ name: "2025", value: 4 }],
			},
			[
				{ year: 2025, points: [] },
				{ year: 2026, points: [{ day: "2026-02-15", cumulative: 30 }] },
			],
		);
		expect(
			screen.getByText(/2025 : 4 déclarations \(0 % du total\)/),
		).toBeInTheDocument();
	});

	it("skips entries whose value is null", () => {
		renderWithTooltip({
			active: true,
			label: "02-15",
			payload: [
				{ name: "2025", value: undefined },
				{ name: "2026", value: 7842 },
			],
		});
		const items = screen.getAllByRole("listitem");
		expect(items).toHaveLength(1);
		// \s matches the U+202F narrow-no-break-space the fr-FR locale emits
		expect(items[0]?.textContent).toMatch(/7\s842 déclarations/);
	});
});
