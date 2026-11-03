import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChangesTable } from "../ChangesTable";

const CHANGES = [
	{ field: "lastName", label: "Nom", previous: "Martin", next: "Durand" },
	{
		field: "phone",
		label: "Numéro de téléphone",
		previous: "Non renseigné",
		next: "01 22 33 44 56",
	},
];

describe("ChangesTable", () => {
	it("names the table with a screen-reader-only caption", () => {
		render(<ChangesTable changes={CHANGES} />);

		expect(
			screen.getByRole("table", { name: "Modifications à confirmer" }),
		).toBeInTheDocument();
		expect(screen.getByText("Modifications à confirmer")).toHaveClass(
			"fr-sr-only",
		);
	});

	it("declares the three column headers with a col scope", () => {
		render(<ChangesTable changes={CHANGES} />);

		const headers = screen.getAllByRole("columnheader");
		expect(headers.map((header) => header.textContent)).toEqual([
			"Information",
			"Valeur actuelle",
			"Nouvelle valeur",
		]);
		for (const header of headers) {
			expect(header).toHaveAttribute("scope", "col");
		}
	});

	it("renders one row per change with the label as row header", () => {
		render(<ChangesTable changes={CHANGES} />);

		const rows = screen.getAllByRole("row").slice(1);
		expect(rows).toHaveLength(2);

		const firstRow = within(rows[0] as HTMLElement);
		expect(firstRow.getByRole("rowheader", { name: "Nom" })).toHaveAttribute(
			"scope",
			"row",
		);
		expect(firstRow.getByRole("cell", { name: "Martin" })).toBeInTheDocument();
		expect(firstRow.getByRole("cell", { name: "Durand" })).toBeInTheDocument();
	});

	it("keeps the bordered DSFR table classes", () => {
		const { container } = render(<ChangesTable changes={CHANGES} />);

		expect(container.firstElementChild).toHaveClass(
			"fr-table",
			"fr-table--bordered",
			"fr-mb-2w",
		);
	});
});
