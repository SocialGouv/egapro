import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NafSectorFilter } from "../NafSectorFilter";

describe("NafSectorFilter", () => {
	it("renders the 21 sections plus the 'all sectors' option", () => {
		render(<NafSectorFilter onChange={vi.fn()} value={undefined} />);

		const select = screen.getByRole<HTMLSelectElement>("combobox", {
			name: "Filtrer par secteur NAF",
		});
		const optionValues = Array.from(select.querySelectorAll("option")).map(
			(option) => option.value,
		);
		expect(optionValues).toEqual([
			"",
			"A",
			"B",
			"C",
			"D",
			"E",
			"F",
			"G",
			"H",
			"I",
			"J",
			"K",
			"L",
			"M",
			"N",
			"O",
			"P",
			"Q",
			"R",
			"S",
			"T",
			"U",
		]);
	});

	it("shows each section label prefixed with its letter", () => {
		render(<NafSectorFilter onChange={vi.fn()} value={undefined} />);

		expect(
			screen.getByRole("option", { name: /^J — Information et communication$/ }),
		).toBeInTheDocument();
	});

	it("reflects the controlled value", () => {
		render(<NafSectorFilter onChange={vi.fn()} value="K" />);

		const select = screen.getByRole<HTMLSelectElement>("combobox", {
			name: "Filtrer par secteur NAF",
		});
		expect(select.value).toBe("K");
	});

	it("calls onChange with the selected section code", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(<NafSectorFilter onChange={onChange} value={undefined} />);

		await user.selectOptions(
			screen.getByRole("combobox", { name: "Filtrer par secteur NAF" }),
			"F",
		);

		expect(onChange).toHaveBeenCalledWith("F");
	});

	it("calls onChange with undefined when 'all sectors' is selected", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(<NafSectorFilter onChange={onChange} value="F" />);

		await user.selectOptions(
			screen.getByRole("combobox", { name: "Filtrer par secteur NAF" }),
			"Tous les secteurs",
		);

		expect(onChange).toHaveBeenCalledWith(undefined);
	});
});
