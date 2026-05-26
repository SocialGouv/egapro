import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompletionFunnelChart, FunnelTooltip } from "../CompletionFunnelChart";
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
});

describe("FunnelTooltip", () => {
	it("renders nothing when inactive", () => {
		const { container } = render(<FunnelTooltip active={false} payload={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when payload is empty", () => {
		const { container } = render(<FunnelTooltip active={true} payload={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when payload is undefined", () => {
		const { container } = render(<FunnelTooltip active={true} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when the first payload entry has no row", () => {
		const { container } = render(
			<FunnelTooltip active={true} payload={[{}]} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders the row label, count and percentage when active with data", () => {
		render(
			<FunnelTooltip
				active={true}
				payload={[
					{
						payload: {
							key: "submitted",
							label: "Déclaration soumise",
							count: 1234,
							pctOfStart: 42,
							pctDropFromPrev: 18,
						},
					},
				]}
			/>,
		);
		expect(screen.getByText(/Déclaration soumise/)).toBeInTheDocument();
		const items = screen.getAllByRole("listitem");
		expect(items[0]?.textContent ?? "").toMatch(
			/1\s234\s+déclarations\s+\(42\s+%\s+du funnel\)/,
		);
		expect(items[1]?.textContent ?? "").toMatch(
			/Chute de\s+18\s+%\s+vs étape précédente/,
		);
	});

	it("omits the drop line when pctDropFromPrev is null", () => {
		render(
			<FunnelTooltip
				active={true}
				payload={[
					{
						payload: {
							key: "draft_started",
							label: "Brouillon créé",
							count: 100,
							pctOfStart: 100,
							pctDropFromPrev: null,
						},
					},
				]}
			/>,
		);
		expect(screen.getByText(/Brouillon créé/)).toBeInTheDocument();
		expect(screen.queryByText(/Chute de/)).not.toBeInTheDocument();
	});
});
