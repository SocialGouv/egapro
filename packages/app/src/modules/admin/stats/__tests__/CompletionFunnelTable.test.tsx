import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildEchartsOption } from "../CompletionFunnelChart";
import { CompletionFunnelTable } from "../CompletionFunnelTable";
import type { FunnelRow } from "../types";

const ROWS: FunnelRow[] = [
	{
		key: "draft_started",
		label: "Brouillon créé",
		count: 100,
		pctOfStart: 100,
		pctDropFromPrev: null,
	},
	{
		key: "indicators_filled",
		label: "Indicateurs saisis",
		count: 80,
		pctOfStart: 80,
		pctDropFromPrev: 20,
	},
	{
		key: "submitted",
		label: "Déclaration transmise",
		count: 30,
		pctOfStart: 30,
		pctDropFromPrev: 62,
	},
];

describe("CompletionFunnelTable (S-K19-T1..T4)", () => {
	it("S-K19-T1: renders nothing when rows are empty", () => {
		const { container } = render(
			<CompletionFunnelTable caption="Funnel principal" rows={[]} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("S-K19-T2: lists every row with its label, count, pctOfStart and drop", () => {
		render(<CompletionFunnelTable caption="Funnel principal" rows={ROWS} />);
		expect(
			screen.getByRole("rowheader", { name: "Brouillon créé" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", { name: "Indicateurs saisis" }),
		).toBeInTheDocument();
		expect(screen.getByText("100")).toBeInTheDocument();
		expect(screen.getByText("62 %")).toBeInTheDocument();
	});

	it("S-K19-T3: shows an em-dash for the first row's drop (null)", () => {
		render(<CompletionFunnelTable caption="Funnel principal" rows={ROWS} />);
		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("S-K19-T4: exposes the caption to assistive tech (visually hidden)", () => {
		render(
			<CompletionFunnelTable caption="Funnel cycle de révision" rows={ROWS} />,
		);
		expect(screen.getByText("Funnel cycle de révision")).toBeInTheDocument();
	});

	it("lists every jalon of the chart legend, in order, with all its values", () => {
		render(<CompletionFunnelTable caption="Funnel principal" rows={ROWS} />);
		const legend = (
			buildEchartsOption(ROWS, 30) as { legend: { data: string[] } }
		).legend;

		const rowheaders = screen
			.getAllByRole("rowheader")
			.map((header) => header.textContent);
		expect(rowheaders).toEqual(legend.data);
		for (const header of screen.getAllByRole("rowheader")) {
			expect(header.closest("tr")?.querySelectorAll("td")).toHaveLength(3);
		}
	});
});
