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
		label: "Soumission → choix conformité",
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

		const headers = screen
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

	it("groups wizard and post-submit rows under distinct section headers", () => {
		render(
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

		expect(
			screen.getByRole("rowheader", {
				name: /Parcours initial \(wizard A–F\)/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", {
				name: "Démarche post-soumission",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", { name: "Introduction" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", {
				name: /Soumission → choix conformité/i,
			}),
		).toBeInTheDocument();
	});
});
