import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DataTable } from "../DataTable";
import type { DataTableColumn } from "../DataTable";

const columns: DataTableColumn[] = [
	{ key: "label", label: "Catégorie", type: "text", readOnly: true },
	{ key: "women", label: "Femmes", type: "number" },
	{ key: "men", label: "Hommes", type: "number" },
];

const rows = [
	{ label: "Ouvriers", women: 10, men: 20 },
	{ label: "Employés", women: 15, men: 25 },
];

describe("DataTable", () => {
	it("renders table caption, column headers, and row data", () => {
		render(<DataTable caption="Effectifs" columns={columns} rows={rows} />);

		expect(screen.getByText("Effectifs")).toBeInTheDocument();
		expect(screen.getByText("Catégorie")).toBeInTheDocument();
		expect(screen.getByText("Femmes")).toBeInTheDocument();
		expect(screen.getByText("Hommes")).toBeInTheDocument();
		expect(screen.getByText("Ouvriers")).toBeInTheDocument();
		expect(screen.getByText("Employés")).toBeInTheDocument();
	});

	it("renders editable inputs for non-readOnly columns", () => {
		render(<DataTable caption="Effectifs" columns={columns} rows={rows} />);

		const inputs = screen.getAllByRole("spinbutton");
		// 2 rows x 2 editable columns = 4 inputs
		expect(inputs).toHaveLength(4);
	});

	it("renders readOnly values as text without input", () => {
		render(<DataTable caption="Effectifs" columns={columns} rows={rows} />);

		expect(screen.getByText("Ouvriers")).toBeInTheDocument();
		// readOnly column should not produce an input for its value
		expect(
			screen.queryByRole("textbox", { name: /catégorie/i }),
		).not.toBeInTheDocument();
	});

	it("calls onCellChange when input changes", async () => {
		const user = userEvent.setup();
		const handleChange = vi.fn();

		render(
			<DataTable
				caption="Effectifs"
				columns={columns}
				onCellChange={handleChange}
				rows={rows}
			/>,
		);

		const inputs = screen.getAllByRole("spinbutton");
		await user.clear(inputs[0] as HTMLElement);

		// clear triggers onChange with empty string
		expect(handleChange).toHaveBeenCalledWith(0, "women", "");
	});

	it("renders total row when showTotal is true", () => {
		render(
			<DataTable caption="Effectifs" columns={columns} rows={rows} showTotal />,
		);

		expect(screen.getByText("Total")).toBeInTheDocument();
		// women total: 10 + 15 = 25, men total: 20 + 25 = 45
		expect(screen.getByText("25")).toBeInTheDocument();
		expect(screen.getByText("45")).toBeInTheDocument();
	});

	it("uses custom totalLabel", () => {
		render(
			<DataTable
				caption="Effectifs"
				columns={columns}
				rows={rows}
				showTotal
				totalLabel="Somme"
			/>,
		);

		expect(screen.getByText("Somme")).toBeInTheDocument();
		expect(screen.queryByText("Total")).not.toBeInTheDocument();
	});
});
