import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("echarts-for-react/lib/core", () => ({
	default: ({ option, className }: { option: unknown; className?: string }) =>
		React.createElement("div", {
			className,
			"data-option": JSON.stringify(option),
			"data-testid": "echarts-mock",
		}),
}));

import {
	buildEchartsOption,
	buildTooltipFormatter,
	CompletionFunnelChart,
	isAboveThreshold,
	labelFormatter,
	pickFunnelColor,
} from "../CompletionFunnelChart";
import type { FunnelRow } from "../types";

const PALETTE_COLORS = [
	"#000091",
	"#465f9d",
	"#417dc4",
	"#009099",
	"#00a95f",
	"#b7a73f",
] as const;
const ALERT_COLOR = "#c9191e";

const EMPTY_ROWS: FunnelRow[] = [
	{
		key: "draft_started",
		label: "Brouillon créé",
		count: 0,
		pctOfStart: 0,
		pctDropFromPrev: null,
	},
	{
		key: "indicators_filled",
		label: "Indicateurs saisis",
		count: 0,
		pctOfStart: 0,
		pctDropFromPrev: 0,
	},
];

const FIRST_ROW: FunnelRow = {
	key: "draft_started",
	label: "Brouillon créé",
	count: 100,
	pctOfStart: 100,
	pctDropFromPrev: null,
};

const SECOND_ROW: FunnelRow = {
	key: "indicators_filled",
	label: "Indicateurs saisis",
	count: 80,
	pctOfStart: 80,
	pctDropFromPrev: 20,
};

const THIRD_ROW: FunnelRow = {
	key: "submitted",
	label: "Déclaration soumise",
	count: 30,
	pctOfStart: 30,
	pctDropFromPrev: 62,
};

const POPULATED_ROWS: FunnelRow[] = [FIRST_ROW, SECOND_ROW, THIRD_ROW];

type ParsedSeries = {
	type: string;
	orient: string;
	sort: string;
	data: Array<{
		name: string;
		value: number;
		row: FunnelRow;
		itemStyle: { color: string };
	}>;
};

function readSeries(container: HTMLElement): ParsedSeries {
	const node = container.querySelector('[data-testid="echarts-mock"]');
	if (!node) throw new Error("echarts mock not rendered");
	const raw = node.getAttribute("data-option");
	if (!raw) throw new Error("data-option missing");
	const parsed = JSON.parse(raw) as { series: ParsedSeries[] };
	const series = parsed.series[0];
	if (!series) throw new Error("series missing in option");
	return series;
}

describe("CompletionFunnelChart (S-K19-C1..C5)", () => {
	it("S-K19-C1: shows an empty-state message when every row has zero count", () => {
		render(
			<CompletionFunnelChart
				caption="Funnel principal"
				dropThreshold={30}
				rows={EMPTY_ROWS}
			/>,
		);
		expect(screen.getByText(/Aucune donnée/)).toBeInTheDocument();
	});

	it("S-K19-C2: includes an accessible figcaption when data is present", () => {
		render(
			<CompletionFunnelChart
				caption="Funnel principal"
				dropThreshold={30}
				rows={POPULATED_ROWS}
			/>,
		);
		expect(
			screen.getByText(/Funnel principal\. Nombre de déclarations/i),
		).toBeInTheDocument();
	});

	it("S-K19-C3: renders a figure landmark via figcaption", () => {
		const { container } = render(
			<CompletionFunnelChart
				caption="Funnel principal"
				dropThreshold={30}
				rows={POPULATED_ROWS}
			/>,
		);
		expect(container.querySelector("figure")).not.toBeNull();
		expect(container.querySelector("figcaption")).not.toBeNull();
	});

	it("S-K19-C4: assigns palette colors to each jalon when no drop is above the threshold", () => {
		const noAlertRows: FunnelRow[] = POPULATED_ROWS.map((row, idx) => ({
			...row,
			pctDropFromPrev: idx === 0 ? null : 5,
		}));
		const { container } = render(
			<CompletionFunnelChart
				caption="Funnel principal"
				dropThreshold={30}
				rows={noAlertRows}
			/>,
		);
		const series = readSeries(container);
		series.data.forEach((datum, idx) => {
			expect(datum.itemStyle.color).toBe(PALETTE_COLORS[idx]);
		});
	});

	it("S-K19-C5: tolerates a single-row funnel (no drop computation needed)", () => {
		const singleRow: FunnelRow[] = [
			{
				key: "draft_started",
				label: "Brouillon créé",
				count: 10,
				pctOfStart: 100,
				pctDropFromPrev: null,
			},
		];
		const { container } = render(
			<CompletionFunnelChart
				caption="Funnel principal"
				dropThreshold={30}
				rows={singleRow}
			/>,
		);
		const series = readSeries(container);
		expect(series.data).toHaveLength(1);
		expect(series.data[0]?.itemStyle.color).toBe(PALETTE_COLORS[0]);
	});

	it("exposes the caption via aria-label on the chart container for assistive tech", () => {
		render(
			<CompletionFunnelChart
				caption="Funnel principal"
				dropThreshold={30}
				rows={POPULATED_ROWS}
			/>,
		);
		expect(
			screen.getByRole("img", { name: "Funnel principal" }),
		).toBeInTheDocument();
	});
});

describe("buildEchartsOption", () => {
	it("uses a horizontal funnel with sort=none to preserve row order", () => {
		const { container } = render(
			<CompletionFunnelChart
				caption="Funnel"
				dropThreshold={30}
				rows={POPULATED_ROWS}
			/>,
		);
		const series = readSeries(container);
		expect(series.type).toBe("funnel");
		expect(series.orient).toBe("horizontal");
		expect(series.sort).toBe("none");
	});

	it("colours each datum: palette per index below threshold, alert red above", () => {
		const { container } = render(
			<CompletionFunnelChart
				caption="Funnel"
				dropThreshold={30}
				rows={POPULATED_ROWS}
			/>,
		);
		const series = readSeries(container);
		expect(series.data[0]?.itemStyle.color).toBe(PALETTE_COLORS[0]);
		expect(series.data[1]?.itemStyle.color).toBe(PALETTE_COLORS[1]);
		expect(series.data[2]?.itemStyle.color).toBe(ALERT_COLOR);
	});

	it("cycles the palette modulo its length when there are more jalons than colors", () => {
		const sevenRows: FunnelRow[] = Array.from(
			{ length: PALETTE_COLORS.length + 1 },
			(_, idx) => ({
				key: `step_${idx}`,
				label: `Étape ${idx + 1}`,
				count: 100 - idx,
				pctOfStart: 100 - idx,
				pctDropFromPrev: idx === 0 ? null : 1,
			}),
		);
		const option = buildEchartsOption(sevenRows, 30);
		const series = (
			option as {
				series: Array<{ data: Array<{ itemStyle: { color: string } }> }>;
			}
		).series[0];
		expect(series?.data[PALETTE_COLORS.length]?.itemStyle.color).toBe(
			PALETTE_COLORS[0],
		);
	});

	it("preserves the row payload alongside name/value so formatters can use it", () => {
		const option = buildEchartsOption(POPULATED_ROWS, 30);
		const series = (
			option as { series: Array<{ data: Array<{ row: FunnelRow }> }> }
		).series[0];
		expect(series?.data[0]?.row).toEqual(FIRST_ROW);
		expect(series?.data[2]?.row).toEqual(THIRD_ROW);
	});

	it("exposes a clickable legend with one entry per jalon", () => {
		const option = buildEchartsOption(POPULATED_ROWS, 30);
		const legend = (
			option as {
				legend: { show: boolean; data: string[] };
			}
		).legend;
		expect(legend.show).toBe(true);
		expect(legend.data).toEqual(POPULATED_ROWS.map((row) => row.label));
	});
});

describe("labelFormatter", () => {
	it("formats name, count and percentage with localized thousands", () => {
		const row: FunnelRow = {
			key: "draft_started",
			label: "Brouillon créé",
			count: 12345,
			pctOfStart: 87,
			pctDropFromPrev: null,
		};
		const out = labelFormatter({
			data: {
				name: row.label,
				value: row.count,
				row,
				itemStyle: { color: "" },
			},
		});
		expect(out).toContain("{name|Brouillon créé}");
		expect(out).toContain("{value|12 345}");
		expect(out).toContain("{pct|87 %}");
	});
});

describe("pickFunnelColor", () => {
	it("returns the palette color matching the index when the drop is below threshold", () => {
		expect(pickFunnelColor(0, null, 30)).toBe(PALETTE_COLORS[0]);
		expect(pickFunnelColor(1, 10, 30)).toBe(PALETTE_COLORS[1]);
		expect(pickFunnelColor(2, 30, 30)).toBe(PALETTE_COLORS[2]);
	});

	it("returns the alert color when pctDropFromPrev exceeds the threshold", () => {
		expect(pickFunnelColor(1, 31, 30)).toBe(ALERT_COLOR);
		expect(pickFunnelColor(4, 99, 30)).toBe(ALERT_COLOR);
	});

	it("wraps the palette index modulo its length", () => {
		const last = PALETTE_COLORS.length - 1;
		expect(pickFunnelColor(PALETTE_COLORS.length, null, 30)).toBe(
			PALETTE_COLORS[0],
		);
		expect(pickFunnelColor(PALETTE_COLORS.length + last, null, 30)).toBe(
			PALETTE_COLORS[last],
		);
	});
});

describe("buildTooltipFormatter", () => {
	it("renders label, count and percentage of funnel", () => {
		const formatter = buildTooltipFormatter(30);
		const html = formatter({
			data: {
				name: FIRST_ROW.label,
				value: FIRST_ROW.count,
				row: FIRST_ROW,
				itemStyle: { color: "#000091" },
			},
		});
		expect(html).toContain("<strong>Brouillon créé</strong>");
		expect(html).toContain("100 déclarations (100 % du funnel)");
	});

	it("omits the drop line when pctDropFromPrev is null (first jalon)", () => {
		const formatter = buildTooltipFormatter(30);
		const html = formatter({
			data: {
				name: FIRST_ROW.label,
				value: FIRST_ROW.count,
				row: FIRST_ROW,
				itemStyle: { color: "#000091" },
			},
		});
		expect(html).not.toContain("Chute de");
	});

	it("shows the drop line with alert styling when above threshold", () => {
		const formatter = buildTooltipFormatter(30);
		const html = formatter({
			data: {
				name: THIRD_ROW.label,
				value: THIRD_ROW.count,
				row: THIRD_ROW,
				itemStyle: { color: "#c9191e" },
			},
		});
		expect(html).toContain("Chute de 62 % vs étape précédente");
		expect(html).toContain("color:#c9191e");
		expect(html).toContain("font-weight:600");
	});

	it("shows the drop line without alert styling when below threshold", () => {
		const formatter = buildTooltipFormatter(30);
		const html = formatter({
			data: {
				name: SECOND_ROW.label,
				value: SECOND_ROW.count,
				row: SECOND_ROW,
				itemStyle: { color: "#000091" },
			},
		});
		expect(html).toContain("Chute de 20 % vs étape précédente");
		expect(html).not.toContain("color:#c9191e");
	});
});

describe("isAboveThreshold", () => {
	it("returns false when pctDropFromPrev is null", () => {
		expect(isAboveThreshold(null, 30)).toBe(false);
	});

	it("returns false when pctDropFromPrev equals the threshold", () => {
		expect(isAboveThreshold(30, 30)).toBe(false);
	});

	it("returns true when pctDropFromPrev exceeds the threshold", () => {
		expect(isAboveThreshold(31, 30)).toBe(true);
	});
});
