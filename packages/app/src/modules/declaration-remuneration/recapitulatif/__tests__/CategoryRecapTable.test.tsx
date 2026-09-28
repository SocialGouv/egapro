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

	it("describes the pay table and associates each value with its section, row and column across categories", () => {
		render(
			<>
				<CategoryRecapTable
					category={makeCategory({ name: "Cadres" })}
					declarationYear={2025}
					index={0}
				/>
				<CategoryRecapTable
					category={makeCategory({ name: "Employés" })}
					declarationYear={2025}
					index={1}
				/>
			</>,
		);

		const payTables = screen
			.getAllByRole("table")
			.filter((table) =>
				table
					.querySelector("caption")
					?.textContent?.includes("Tableau des rémunérations brutes"),
			)
			.map((table) => table as HTMLTableElement);
		expect(payTables).toHaveLength(2);
		const allIds = payTables.flatMap((table) =>
			Array.from(table.querySelectorAll("[id]"), (element) => element.id),
		);
		expect(new Set(allIds).size).toBe(allIds.length);

		payTables.forEach((table, categoryIndex) => {
			expect(table.querySelector("caption")).toHaveTextContent(
				`Catégorie d'emplois n°${categoryIndex + 1}`,
			);
			expect(table.querySelector("caption")).toHaveTextContent("2025");
			expect(table.querySelector("caption")).toHaveTextContent(
				"quatre colonnes (Donnée, Femmes, Hommes et Écart) et deux sections",
			);

			const columnHeaders = Array.from(table.querySelectorAll("thead th[id]"));
			expect(columnHeaders.map((header) => header.textContent?.trim())).toEqual(
				["Femmes", "Hommes", "Écart Seuil réglementaire : 5 %"],
			);
			expect(table.tBodies).toHaveLength(2);

			Array.from(table.tBodies).forEach((body, sectionIndex) => {
				const section = body.querySelector('th[scope="rowgroup"]');
				expect(section).toHaveTextContent(
					sectionIndex === 0
						? "Rémunération annuelle brute"
						: "Rémunération horaire brute",
				);
				expect(body.querySelector('th[scope="colgroup"]')).toBeNull();
				expect(body.rows).toHaveLength(4);

				Array.from(body.rows)
					.slice(1)
					.forEach((row, rowIndex) => {
						const rowHeader = row.querySelector('th[scope="row"]');
						const expectedLabel = [
							"Salaire de base",
							"Composantes variables",
							"Total",
						][rowIndex];
						if (!expectedLabel) throw new Error("Unexpected pay table row");
						expect(rowHeader).toHaveTextContent(expectedLabel);
						const cells = Array.from(row.querySelectorAll("td"));
						expect(cells).toHaveLength(3);
						cells.forEach((cell, columnIndex) => {
							expect(cell.getAttribute("headers")?.split(" ")).toEqual([
								section?.id,
								rowHeader?.id,
								columnHeaders[columnIndex]?.id,
							]);
						});
					});
			});
		});
	});

	it("explains a non-calculable category while keeping its tables", () => {
		render(
			<CategoryRecapTable
				category={makeCategory({
					womenCount: 0,
					menCount: 3,
					hourlyWomenCount: 0,
					hourlyMenCount: 3,
				})}
				declarationYear={2025}
				index={0}
			/>,
		);

		expect(screen.getByText("Aucun écart à calculer")).toBeInTheDocument();
		expect(screen.getAllByRole("table")).toHaveLength(2);
	});

	it("does not mark isolated or crossed zeroes as non-calculable", () => {
		const { rerender } = render(
			<CategoryRecapTable
				category={makeCategory({
					womenCount: 0,
					menCount: 3,
					hourlyWomenCount: 3,
					hourlyMenCount: 0,
				})}
				declarationYear={2025}
				index={0}
			/>,
		);
		expect(
			screen.queryByText("Aucun écart à calculer"),
		).not.toBeInTheDocument();

		rerender(
			<CategoryRecapTable
				category={makeCategory({
					womenCount: 0,
					menCount: 3,
					hourlyWomenCount: 2,
					hourlyMenCount: 3,
				})}
				declarationYear={2025}
				index={0}
			/>,
		);
		expect(
			screen.queryByText("Aucun écart à calculer"),
		).not.toBeInTheDocument();
	});

	it("keeps legacy pay visible without the non-calculable explanation", () => {
		render(
			<CategoryRecapTable
				category={makeCategory({
					womenCount: 0,
					menCount: 3,
					hourlyWomenCount: 0,
					hourlyMenCount: 3,
					annualBaseWomen: "30000",
					annualBaseMen: "32000",
				})}
				declarationYear={2025}
				index={0}
			/>,
		);

		expect(
			screen.queryByText("Aucun écart à calculer"),
		).not.toBeInTheDocument();
		expect(screen.getAllByText("30 000 €")).toHaveLength(2);
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
