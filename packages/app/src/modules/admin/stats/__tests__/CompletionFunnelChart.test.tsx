import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompletionFunnelChart } from "../CompletionFunnelChart";
import type { FunnelRow } from "../types";

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

const POPULATED_ROWS: FunnelRow[] = [
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
		label: "Déclaration soumise",
		count: 30,
		pctOfStart: 30,
		pctDropFromPrev: 62,
	},
];

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

	it("S-K19-C4: passes the row count without crashing when a drop is below the threshold", () => {
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
		expect(container.querySelector("figure")).not.toBeNull();
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
		expect(container.querySelector("figure")).not.toBeNull();
	});

	it("renders one trapezoid path per row with the SVG title for native tooltip", () => {
		const { container } = render(
			<CompletionFunnelChart
				caption="Funnel principal"
				dropThreshold={30}
				rows={POPULATED_ROWS}
			/>,
		);
		const paths = container.querySelectorAll("svg path");
		expect(paths.length).toBe(POPULATED_ROWS.length);
		const titles = container.querySelectorAll("svg path title");
		expect(titles.length).toBe(POPULATED_ROWS.length);
		expect(titles[0]?.textContent).toMatch(/Brouillon créé/);
		expect(titles[0]?.textContent).not.toMatch(/chute/);
		expect(titles[1]?.textContent).toMatch(/chute de 20 %/);
	});

	it("renders the count and percentage labels for each row in SVG text", () => {
		render(
			<CompletionFunnelChart
				caption="Funnel principal"
				dropThreshold={30}
				rows={POPULATED_ROWS}
			/>,
		);
		expect(screen.getByText("100")).toBeInTheDocument();
		expect(screen.getByText("80")).toBeInTheDocument();
		expect(screen.getByText("30")).toBeInTheDocument();
		expect(screen.getByText(/↓\s*62\s*%/)).toBeInTheDocument();
	});
});
