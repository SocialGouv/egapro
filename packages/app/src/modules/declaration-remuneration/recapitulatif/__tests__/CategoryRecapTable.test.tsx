import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { CategoryRecapTable } from "../CategoryRecapTable";

function makeCategory(
	overrides: Partial<EmployeeCategoryRow> = {},
): EmployeeCategoryRow {
	return {
		name: "",
		womenCount: null,
		menCount: null,
		hourlyWomenCount: null,
		hourlyMenCount: null,
		annualBaseWomen: null,
		annualBaseMen: null,
		annualVariableWomen: null,
		annualVariableMen: null,
		hourlyBaseWomen: null,
		hourlyBaseMen: null,
		hourlyVariableWomen: null,
		hourlyVariableMen: null,
		...overrides,
	};
}

function effectifRowCells(
	label: "Rémunération annuelle" | "Rémunération horaire",
) {
	const row = screen.getByRole("rowheader", { name: label })
		.parentElement as HTMLElement;
	return within(row).getAllByRole("cell");
}

function totalRowGapCell() {
	const rows = screen
		.getAllByRole("rowheader", { name: "Total" })
		.map((th) => th.parentElement as HTMLElement);
	return rows.map((row) => within(row).getAllByRole("cell").at(-1));
}

describe("CategoryRecapTable", () => {
	it("shows Femmes/Hommes/Total on the annual and hourly headcount rows (#4368)", () => {
		render(
			<CategoryRecapTable
				category={makeCategory({
					womenCount: 53,
					menCount: 25,
					hourlyWomenCount: 4,
					hourlyMenCount: 2,
				})}
				declarationYear={2025}
				index={0}
			/>,
		);
		const annualCells = effectifRowCells("Rémunération annuelle");
		expect(annualCells[0]).toHaveTextContent("53");
		expect(annualCells[1]).toHaveTextContent("25");
		expect(annualCells[2]).toHaveTextContent("78");

		const hourlyCells = effectifRowCells("Rémunération horaire");
		expect(hourlyCells[0]).toHaveTextContent("4");
		expect(hourlyCells[1]).toHaveTextContent("2");
		expect(hourlyCells[2]).toHaveTextContent("6");
	});

	it("shows '—' for a missing hourly headcount, never an invented 0 (#4368)", () => {
		render(
			<CategoryRecapTable
				category={makeCategory({ womenCount: 53, menCount: 25 })}
				declarationYear={2025}
				index={0}
			/>,
		);
		const hourlyCells = effectifRowCells("Rémunération horaire");
		expect(hourlyCells[0]).toHaveTextContent("—");
		expect(hourlyCells[1]).toHaveTextContent("—");
		expect(hourlyCells[2]).toHaveTextContent("—");
	});

	it("shows '—' for a missing annual headcount too, never an invented 0 (#4368)", () => {
		render(
			<CategoryRecapTable
				category={makeCategory()}
				declarationYear={2025}
				index={0}
			/>,
		);
		const annualCells = effectifRowCells("Rémunération annuelle");
		expect(annualCells[0]).toHaveTextContent("—");
		expect(annualCells[1]).toHaveTextContent("—");
		expect(annualCells[2]).toHaveTextContent("—");
	});

	it("renders the heading with the category name and 1-based index", () => {
		render(
			<CategoryRecapTable
				category={makeCategory({ name: "Ouvriers / Employés" })}
				declarationYear={2025}
				index={1}
			/>,
		);
		expect(
			screen.getByText("Catégorie d'emplois n°2 : Ouvriers / Employés"),
		).toBeInTheDocument();
	});

	it("renders the heading without a name suffix when name is empty", () => {
		render(
			<CategoryRecapTable
				category={makeCategory()}
				declarationYear={2025}
				index={0}
			/>,
		);
		expect(screen.getByText("Catégorie d'emplois n°1")).toBeInTheDocument();
	});

	it("flags an 'élevé' badge when a salary gap reaches the 5% threshold", () => {
		render(
			<CategoryRecapTable
				category={makeCategory({
					annualBaseWomen: "90",
					annualBaseMen: "100",
				})}
				declarationYear={2025}
				index={0}
			/>,
		);
		expect(screen.getAllByText("élevé").length).toBeGreaterThanOrEqual(1);
	});

	it("renders no 'élevé' badge when all gaps stay below the threshold", () => {
		render(
			<CategoryRecapTable
				category={makeCategory({
					annualBaseWomen: "99",
					annualBaseMen: "100",
				})}
				declarationYear={2025}
				index={0}
			/>,
		);
		expect(screen.queryByText("élevé")).not.toBeInTheDocument();
	});

	it("flags 'élevé' badges on base/variable rows without computing a Total gap (#4205)", () => {
		render(
			<CategoryRecapTable
				category={makeCategory({
					annualBaseWomen: "30000",
					annualBaseMen: "32000",
					annualVariableWomen: "2000",
					annualVariableMen: "3000",
					hourlyBaseWomen: "18",
					hourlyBaseMen: "20",
					hourlyVariableWomen: "1",
					hourlyVariableMen: "2",
				})}
				declarationYear={2025}
				index={0}
			/>,
		);
		// Annual base 6,25 % + variable 33 % + hourly base 10 % + hourly variable 50 %
		// → 4 base/variable badges, none from the (removed) Total gap.
		expect(screen.getAllByText("élevé")).toHaveLength(4);
	});

	it("renders no Total gap value, only the 'Non applicable' alternative (#4205)", () => {
		render(
			<CategoryRecapTable
				category={makeCategory({
					annualBaseWomen: "90",
					annualBaseMen: "100",
					annualVariableWomen: "40",
					annualVariableMen: "50",
					hourlyBaseWomen: "18",
					hourlyBaseMen: "20",
					hourlyVariableWomen: "1",
					hourlyVariableMen: "2",
				})}
				declarationYear={2025}
				index={0}
			/>,
		);
		for (const cell of totalRowGapCell()) {
			expect(cell).toHaveTextContent("Non applicable");
			expect(cell).not.toHaveTextContent("%");
			expect(within(cell as HTMLElement).queryByText("élevé")).toBeNull();
		}
	});
});
