import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatsBarTable } from "../StatsBarTable";

type LabeledRow = { key: string; label: string; count: number };
type DeviceRow = {
	key: string;
	label: string;
	desktop: number;
	smartphone: number;
	tablet: number;
};

const LABELED_ROWS: LabeledRow[] = [
	{ key: "cse_models", label: "Modèles d'avis CSE", count: 50 },
	{ key: "objective_criteria", label: "Critères objectifs", count: 30 },
];

const DEVICE_ROWS: DeviceRow[] = [
	{
		key: "modification",
		label: "Modification (déclaration)",
		desktop: 30,
		smartphone: 12,
		tablet: 3,
	},
	{
		key: "deposit",
		label: "Dépôt (avis CSE)",
		desktop: 8,
		smartphone: 0,
		tablet: 0,
	},
];

describe("StatsBarTable", () => {
	it("renders nothing when given no rows", () => {
		const { container } = render(
			<StatsBarTable
				caption="Clics sur les liens d'aide"
				columns={[{ key: "count", label: "Clics" }]}
				rowHeader="Lien"
				rows={[]}
			/>,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders a row header per row and a data cell per column (single column)", () => {
		render(
			<StatsBarTable
				caption="Clics sur les liens d'aide"
				columns={[{ key: "count", label: "Clics" }]}
				rowHeader="Lien"
				rows={LABELED_ROWS}
			/>,
		);

		expect(
			screen.getByRole("rowheader", { name: "Modèles d'avis CSE" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", { name: "Critères objectifs" }),
		).toBeInTheDocument();
		expect(screen.getAllByRole("rowheader")).toHaveLength(2);
		expect(screen.getAllByRole("cell")).toHaveLength(2);
	});

	it("renders one data cell per column for a multi-column (device) dataset", () => {
		render(
			<StatsBarTable
				caption="Répartition par appareil"
				columns={[
					{ key: "desktop", label: "Ordinateur" },
					{ key: "smartphone", label: "Smartphone" },
					{ key: "tablet", label: "Tablette" },
				]}
				rowHeader="Comportement"
				rows={DEVICE_ROWS}
			/>,
		);

		const columnHeaders = screen
			.getAllByRole("columnheader")
			.map((el) => el.textContent);
		expect(columnHeaders).toEqual([
			"Comportement",
			"Ordinateur",
			"Smartphone",
			"Tablette",
		]);
		expect(screen.getAllByRole("rowheader")).toHaveLength(2);
		expect(screen.getAllByRole("cell")).toHaveLength(6);
	});

	it("formats numeric values with the French thousands separator", () => {
		render(
			<StatsBarTable
				caption="Clics sur les liens d'aide"
				columns={[{ key: "count", label: "Clics" }]}
				rowHeader="Lien"
				rows={[{ key: "cse_models", label: "Modèles", count: 1234 }]}
			/>,
		);

		const cell = screen.getByRole("cell");
		expect(cell.textContent).toContain("1");
		expect(cell.textContent).toContain("234");
	});

	it("exposes the caption to assistive tech (visually hidden)", () => {
		render(
			<StatsBarTable
				caption="Répartition par appareil"
				columns={[{ key: "desktop", label: "Ordinateur" }]}
				rowHeader="Comportement"
				rows={DEVICE_ROWS}
			/>,
		);
		expect(screen.getByText("Répartition par appareil")).toBeInTheDocument();
	});

	it("renders string values verbatim and falls back to 0 for missing values", () => {
		type MixedRow = {
			key: string;
			label: string;
			note: string;
			count?: number;
		};
		render(
			<StatsBarTable<MixedRow>
				caption="Valeurs mixtes"
				columns={[
					{ key: "note", label: "Note" },
					{ key: "count", label: "Total" },
				]}
				rowHeader="Ligne"
				rows={[{ key: "r1", label: "Première", note: "à venir" }]}
			/>,
		);

		const cells = screen.getAllByRole("cell").map((el) => el.textContent);
		expect(cells).toEqual(["à venir", "0"]);
	});
});
