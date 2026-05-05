import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CompanySizeFilter } from "../CompanySizeFilter";

describe("CompanySizeFilter", () => {
	it("renders the six options in order", () => {
		render(<CompanySizeFilter onChange={vi.fn()} value={undefined} />);

		const select = screen.getByRole("combobox", {
			name: "Filtrer par effectif",
		});
		const optionTexts = Array.from(select.querySelectorAll("option")).map(
			(option) => option.textContent,
		);
		expect(optionTexts).toEqual([
			"Toutes tailles",
			"Moins de 50 salariés",
			"50 à 99 salariés",
			"100 à 149 salariés",
			"150 à 249 salariés",
			"250 salariés et plus",
		]);
	});

	it("reflects the controlled value", () => {
		render(<CompanySizeFilter onChange={vi.fn()} value="100-149" />);

		const select = screen.getByRole<HTMLSelectElement>("combobox", {
			name: "Filtrer par effectif",
		});
		expect(select.value).toBe("100-149");
	});

	it("calls onChange with the selected range", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(<CompanySizeFilter onChange={onChange} value={undefined} />);

		await user.selectOptions(
			screen.getByRole("combobox", { name: "Filtrer par effectif" }),
			"50-99",
		);

		expect(onChange).toHaveBeenCalledWith("50-99");
	});

	it("calls onChange with undefined when 'Toutes tailles' is selected", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(<CompanySizeFilter onChange={onChange} value="250+" />);

		await user.selectOptions(
			screen.getByRole("combobox", { name: "Filtrer par effectif" }),
			"Toutes tailles",
		);

		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	it("links the label to the select via htmlFor/id", () => {
		render(
			<CompanySizeFilter id="effectif" onChange={vi.fn()} value={undefined} />,
		);

		const select = screen.getByRole("combobox", {
			name: "Filtrer par effectif",
		});
		expect(select).toHaveAttribute("id", "effectif");
	});

	it("accepts a custom label", () => {
		render(
			<CompanySizeFilter
				label="Tranche d'effectif"
				onChange={vi.fn()}
				value={undefined}
			/>,
		);

		expect(
			screen.getByRole("combobox", { name: "Tranche d'effectif" }),
		).toBeInTheDocument();
	});
});
