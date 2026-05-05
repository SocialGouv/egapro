import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { YearsFilter } from "../YearsFilter";

describe("YearsFilter", () => {
	it("renders one checkbox per available year", () => {
		render(
			<YearsFilter
				availableYears={[2026, 2025, 2024]}
				onChange={vi.fn()}
				selectedYears={[]}
			/>,
		);

		expect(screen.getByRole("checkbox", { name: "2026" })).toBeInTheDocument();
		expect(screen.getByRole("checkbox", { name: "2025" })).toBeInTheDocument();
		expect(screen.getByRole("checkbox", { name: "2024" })).toBeInTheDocument();
	});

	it("reflects the selected years", () => {
		render(
			<YearsFilter
				availableYears={[2026, 2025, 2024]}
				onChange={vi.fn()}
				selectedYears={[2026, 2024]}
			/>,
		);

		expect(screen.getByRole("checkbox", { name: "2026" })).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "2025" })).not.toBeChecked();
		expect(screen.getByRole("checkbox", { name: "2024" })).toBeChecked();
	});

	it("adds a year to the selection sorted ascending on check", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(
			<YearsFilter
				availableYears={[2026, 2025, 2024]}
				onChange={onChange}
				selectedYears={[2026]}
			/>,
		);

		await user.click(screen.getByRole("checkbox", { name: "2024" }));
		expect(onChange).toHaveBeenCalledWith([2024, 2026]);
	});

	it("removes a year on uncheck", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(
			<YearsFilter
				availableYears={[2026, 2025, 2024]}
				onChange={onChange}
				selectedYears={[2026, 2024]}
			/>,
		);

		await user.click(screen.getByRole("checkbox", { name: "2026" }));
		expect(onChange).toHaveBeenCalledWith([2024]);
	});

	it("disables unchecked checkboxes once maxSelection is reached", () => {
		render(
			<YearsFilter
				availableYears={[2026, 2025, 2024, 2023, 2022, 2021]}
				maxSelection={3}
				onChange={vi.fn()}
				selectedYears={[2026, 2025, 2024]}
			/>,
		);

		expect(screen.getByRole("checkbox", { name: "2026" })).not.toBeDisabled();
		expect(screen.getByRole("checkbox", { name: "2023" })).toBeDisabled();
		expect(screen.getByRole("checkbox", { name: "2021" })).toBeDisabled();
	});

	it("binds the fieldset legend to the group for screen readers", () => {
		render(
			<YearsFilter
				availableYears={[2026]}
				onChange={vi.fn()}
				selectedYears={[]}
			/>,
		);

		expect(
			screen.getByRole("group", { name: /années à comparer/i }),
		).toBeInTheDocument();
	});
});
