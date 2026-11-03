import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepDurationsTable } from "../StepDurationsTable";
import type { StepDurationRow } from "../types";

function buildWizardRow(
	overrides: Partial<StepDurationRow> = {},
): StepDurationRow {
	return {
		key: `step_${overrides.step ?? 1}`,
		phase: "wizard",
		step: 1,
		label: "Effectifs",
		sampleSize: 10,
		completedSampleSize: 10,
		medianDays: 5,
		p90Days: 9,
		...overrides,
	};
}

function buildPostSubmitRow(
	overrides: Partial<StepDurationRow> = {},
): StepDurationRow {
	return {
		key: "submit_to_path_choice",
		phase: "post_submit",
		step: null,
		label: "Délai avant choix du parcours",
		sampleSize: 8,
		completedSampleSize: 8,
		medianDays: 3,
		p90Days: 7,
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
					buildWizardRow({
						step: 0,
						label: "Introduction",
						sampleSize: 12,
						key: "step_0",
					}),
					buildWizardRow({ step: 1, label: "Effectifs", sampleSize: 10 }),
				]}
			/>,
		);

		const headers = within(
			screen.getByRole<HTMLTableElement>("table").tHead as HTMLElement,
		)
			.getAllByRole("columnheader")
			.map((el) => el.textContent);
		expect(headers).toEqual([
			"Étape ou jalon",
			"Médiane (j)",
			"p90 (j)",
			"Échantillon",
		]);

		// 1 column-header row + 1 group-header row + 2 data rows = 4 rows
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThanOrEqual(4);

		const firstDataRow = rows[2];
		if (!firstDataRow) throw new Error("missing row");
		expect(within(firstDataRow).getByRole("rowheader").textContent).toBe(
			"Introduction",
		);
	});

	it("formats numeric values with French decimal separator (1 decimal)", () => {
		render(
			<StepDurationsTable
				rows={[buildWizardRow({ medianDays: 5.5, p90Days: 9.12 })]}
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
					buildWizardRow({
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

	it("links every cell to its phase, row and column headers, without scope on the phase header (RGAA 5.7)", () => {
		const { container } = render(
			<StepDurationsTable
				rows={[
					buildWizardRow({
						step: 0,
						label: "Introduction",
						key: "step_0",
					}),
					buildPostSubmitRow(),
				]}
			/>,
		);

		expect(container.querySelector('[scope="rowgroup"]')).toBeNull();
		const table = screen.getByRole<HTMLTableElement>("table");
		const columnHeaders = Array.from(table.querySelectorAll("thead th[id]"));
		expect(columnHeaders).toHaveLength(3);
		expect(
			Array.from(table.tBodies, (body) => body.rows[0]?.textContent),
		).toEqual(["Parcours initial (wizard A–F)", "Démarche post-transmission"]);
		for (const body of Array.from(table.tBodies)) {
			const [headerRow, ...dataRows] = Array.from(body.rows);
			const phaseHeader = headerRow?.querySelector("th");
			expect(phaseHeader).not.toHaveAttribute("scope");
			expect(phaseHeader?.id).toBeTruthy();
			expect(dataRows).toHaveLength(1);
			for (const row of dataRows) {
				const rowHeader = row.querySelector('th[scope="row"]');
				expect(rowHeader?.id).toBeTruthy();
				expect(
					Array.from(row.querySelectorAll("td"), (cell) =>
						cell.getAttribute("headers"),
					),
				).toEqual(
					columnHeaders.map(
						(column) => `${phaseHeader?.id} ${rowHeader?.id} ${column.id}`,
					),
				);
			}
		}
		const ids = Array.from(table.querySelectorAll("[id]"), (el) => el.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(
			screen.getByRole("rowheader", { name: "Introduction" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", {
				name: /Délai avant choix du parcours/i,
			}),
		).toBeInTheDocument();
	});
});
