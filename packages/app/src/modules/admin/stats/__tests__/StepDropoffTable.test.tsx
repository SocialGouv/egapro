import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepDropoffTable } from "../StepDropoffTable";
import type { StepDropoffRow } from "../types";

function buildRow(overrides: Partial<StepDropoffRow> = {}): StepDropoffRow {
	return {
		step: 1,
		label: "Effectifs",
		total: 10,
		abandoned: 2,
		dropoffRate: 20,
		...overrides,
	};
}

describe("StepDropoffTable", () => {
	it("renders nothing when given no rows", () => {
		const { container } = render(<StepDropoffTable rows={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders one row per step with the expected columns", () => {
		render(
			<StepDropoffTable
				rows={[
					buildRow({
						step: 0,
						label: "Introduction",
						total: 100,
						abandoned: 5,
						dropoffRate: 5,
					}),
					buildRow({
						step: 1,
						label: "Effectifs",
						total: 80,
						abandoned: 20,
						dropoffRate: 25,
					}),
				]}
			/>,
		);

		const headers = screen
			.getAllByRole("columnheader")
			.map((el) => el.textContent);
		expect(headers).toEqual([
			"Étape",
			"Taux d'abandon (%)",
			"Abandonnées",
			"Total entreprises passées par l'étape",
		]);

		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThanOrEqual(3);

		const introRow = rows[1];
		if (!introRow) throw new Error("missing row");
		expect(within(introRow).getByRole("rowheader").textContent).toBe(
			"Introduction",
		);
	});

	it("formats numeric values with French decimal separator (1 decimal for %)", () => {
		render(
			<StepDropoffTable
				rows={[buildRow({ dropoffRate: 16.7, abandoned: 1234, total: 5000 })]}
			/>,
		);

		const cells = screen.getAllByRole("cell").map((el) => el.textContent);
		expect(cells).toContain("16,7");
		expect(
			cells.some((value) => value?.includes("1") && value?.includes("234")),
		).toBe(true);
	});

	it("formats a rate of 0 % as '0,0'", () => {
		render(
			<StepDropoffTable
				rows={[
					buildRow({
						step: 5,
						label: "Écart par catégorie de salariés",
						total: 0,
						abandoned: 0,
						dropoffRate: 0,
					}),
				]}
			/>,
		);

		const cells = screen.getAllByRole("cell").map((el) => el.textContent);
		expect(cells).toContain("0,0");
	});
});
