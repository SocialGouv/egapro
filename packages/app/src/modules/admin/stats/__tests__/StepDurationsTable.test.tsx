import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepDurationsTable } from "../StepDurationsTable";
import type { StepDurationRow } from "../types";

function buildRow(overrides: Partial<StepDurationRow> = {}): StepDurationRow {
	return {
		step: 1,
		label: "Effectifs",
		sampleSize: 10,
		completedSampleSize: 10,
		medianDays: 5,
		p90Days: 9,
		...overrides,
	};
}

describe("StepDurationsTable", () => {
	it("renders nothing when given no rows", () => {
		const { container } = render(<StepDurationsTable rows={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders one row per step with the expected columns", () => {
		render(
			<StepDurationsTable
				rows={[
					buildRow({ step: 0, label: "Introduction", sampleSize: 12 }),
					buildRow({ step: 1, label: "Effectifs", sampleSize: 10 }),
				]}
			/>,
		);

		const headers = screen
			.getAllByRole("columnheader")
			.map((el) => el.textContent);
		expect(headers).toEqual(["Étape", "Médiane (j)", "p90 (j)", "Échantillon"]);

		const rows = screen.getAllByRole("row");
		expect(rows).toHaveLength(3);

		const firstDataRow = rows[1];
		if (!firstDataRow) throw new Error("missing row");
		expect(within(firstDataRow).getByRole("rowheader").textContent).toBe(
			"Introduction",
		);
	});

	it("formats numeric values with French decimal separator (1 decimal)", () => {
		render(
			<StepDurationsTable
				rows={[buildRow({ medianDays: 5.5, p90Days: 9.12 })]}
			/>,
		);

		const cells = screen.getAllByRole("cell").map((el) => el.textContent);
		expect(cells).toContain("5,5");
		expect(cells).toContain("9,1");
	});

	it("shows an em dash when percentiles are null (sample too small)", () => {
		render(
			<StepDurationsTable
				rows={[
					buildRow({
						sampleSize: 2,
						medianDays: null,
						p90Days: null,
					}),
				]}
			/>,
		);

		const cells = screen.getAllByRole("cell").map((el) => el.textContent);
		expect(cells.filter((value) => value === "—")).toHaveLength(2);
	});
});
