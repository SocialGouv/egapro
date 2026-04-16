import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CompanySizeFilter } from "../CompanySizeFilter";

describe("CompanySizeFilter", () => {
	it("renders every company size option plus 'Toutes tailles'", () => {
		render(<CompanySizeFilter onChange={vi.fn()} value={undefined} />);

		expect(
			screen.getByRole("option", { name: "Toutes tailles" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Moins de 50 salariés" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "50 à 99 salariés" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "100 à 149 salariés" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "150 à 249 salariés" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "250 salariés et plus" }),
		).toBeInTheDocument();
	});

	it("associates the label with the select via htmlFor/id", () => {
		render(
			<CompanySizeFilter id="my-filter" onChange={vi.fn()} value={undefined} />,
		);

		const select = screen.getByLabelText("Filtrer par effectif");
		expect(select).toHaveAttribute("id", "my-filter");
	});

	it("reflects the controlled value on the select", () => {
		render(<CompanySizeFilter onChange={vi.fn()} value="100-149" />);

		expect(screen.getByLabelText("Filtrer par effectif")).toHaveValue(
			"100-149",
		);
	});

	it("emits the selected range via onChange", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		render(<CompanySizeFilter onChange={onChange} value={undefined} />);

		await user.selectOptions(
			screen.getByLabelText("Filtrer par effectif"),
			"50-99",
		);
		expect(onChange).toHaveBeenCalledWith("50-99");
	});

	it("emits undefined when 'Toutes tailles' is picked", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		render(<CompanySizeFilter onChange={onChange} value="50-99" />);

		await user.selectOptions(
			screen.getByLabelText("Filtrer par effectif"),
			"Toutes tailles",
		);
		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	it("accepts a custom label", () => {
		render(
			<CompanySizeFilter
				label="Effectif"
				onChange={vi.fn()}
				value={undefined}
			/>,
		);

		expect(screen.getByLabelText("Effectif")).toBeInTheDocument();
	});
});
