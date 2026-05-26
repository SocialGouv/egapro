import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	buildColorAccessor,
	buildTooltipRenderer,
	CompletionFunnelChart,
	FunnelTooltip,
	formatFunnelValue,
} from "../CompletionFunnelChart";
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

function buildTooltipPart(
	row: FunnelRow,
): Parameters<typeof FunnelTooltip>[0]["part"] {
	return {
		data: {
			id: row.key,
			value: row.count,
			label: row.label,
			rowCount: row.count,
			rowPctOfStart: row.pctOfStart,
			rowPctDropFromPrev: row.pctDropFromPrev ?? -1,
		},
	} as unknown as Parameters<typeof FunnelTooltip>[0]["part"];
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

describe("FunnelTooltip", () => {
	it("renders label, count and percentage of funnel", () => {
		const row = FIRST_ROW;
		render(<FunnelTooltip dropThreshold={30} part={buildTooltipPart(row)} />);
		expect(screen.getByText(row.label)).toBeInTheDocument();
		expect(
			screen.getByText(/100 déclarations \(100 % du funnel\)/),
		).toBeInTheDocument();
	});

	it("omits the drop line when pctDropFromPrev is null (first jalon)", () => {
		const row = FIRST_ROW;
		render(<FunnelTooltip dropThreshold={30} part={buildTooltipPart(row)} />);
		expect(screen.queryByText(/Chute de/)).not.toBeInTheDocument();
	});

	it("shows the drop line with the alert styling when above threshold", () => {
		const row = THIRD_ROW;
		const { container } = render(
			<FunnelTooltip dropThreshold={30} part={buildTooltipPart(row)} />,
		);
		expect(
			screen.getByText(/Chute de 62 % vs étape précédente/),
		).toBeInTheDocument();
		expect(
			container.querySelector('[class*="tooltipItemAlert"]'),
		).not.toBeNull();
	});

	it("shows the drop line with the default styling when below threshold", () => {
		const row = SECOND_ROW;
		const { container } = render(
			<FunnelTooltip dropThreshold={30} part={buildTooltipPart(row)} />,
		);
		expect(
			screen.getByText(/Chute de 20 % vs étape précédente/),
		).toBeInTheDocument();
		expect(container.querySelector('[class*="tooltipItemAlert"]')).toBeNull();
	});
});

describe("nivo render-prop helpers", () => {
	function nivoDatum(row: FunnelRow) {
		return {
			id: row.key,
			value: row.count,
			label: row.label,
			rowCount: row.count,
			rowPctOfStart: row.pctOfStart,
			rowPctDropFromPrev: row.pctDropFromPrev ?? -1,
		};
	}

	it("buildColorAccessor returns the alert colour when the drop exceeds the threshold", () => {
		const accessor = buildColorAccessor(30);
		expect(accessor(nivoDatum(THIRD_ROW))).toBe("#c9191e");
	});

	it("buildColorAccessor returns the default colour for the first jalon (no drop)", () => {
		const accessor = buildColorAccessor(30);
		expect(accessor(nivoDatum(FIRST_ROW))).toBe("#000091");
	});

	it("buildColorAccessor returns the default colour when the drop is below the threshold", () => {
		const accessor = buildColorAccessor(30);
		expect(accessor(nivoDatum(SECOND_ROW))).toBe("#000091");
	});

	it("formatFunnelValue formats integers with French locale", () => {
		expect(formatFunnelValue(12400)).toBe((12400).toLocaleString("fr-FR"));
	});

	it("buildTooltipRenderer returns a component that renders FunnelTooltip", () => {
		const Renderer = buildTooltipRenderer(30);
		const row = THIRD_ROW;
		render(
			<Renderer
				part={
					{
						data: nivoDatum(row),
					} as unknown as Parameters<typeof FunnelTooltip>[0]["part"]
				}
			/>,
		);
		expect(
			screen.getByText(/Chute de 62 % vs étape précédente/),
		).toBeInTheDocument();
	});
});
