import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StatsFilterBar } from "../StatsFilterBar";

describe("StatsFilterBar", () => {
	const baseProps = {
		year: 2026,
		onYearChange: vi.fn(),
		sizeRange: undefined,
		onSizeRangeChange: vi.fn(),
		availableYears: [2026, 2025, 2024, 2023] as const,
	};

	it("renders the year select with the supplied options", () => {
		render(<StatsFilterBar {...baseProps} />);
		const yearSelect = screen.getByLabelText("Année") as HTMLSelectElement;
		expect(yearSelect).toHaveValue("2026");
		expect(yearSelect.options).toHaveLength(4);
	});

	it("emits the parsed numeric year when changed", async () => {
		const user = userEvent.setup();
		const onYearChange = vi.fn();
		render(<StatsFilterBar {...baseProps} onYearChange={onYearChange} />);

		await user.selectOptions(screen.getByLabelText("Année"), "2025");

		expect(onYearChange).toHaveBeenCalledWith(2025);
	});

	it("renders the company size filter wired to the same props", () => {
		render(<StatsFilterBar {...baseProps} />);
		expect(screen.getByLabelText("Filtrer par effectif")).toBeInTheDocument();
	});

	it("emits the selected size range", async () => {
		const user = userEvent.setup();
		const onSizeRangeChange = vi.fn();
		render(
			<StatsFilterBar {...baseProps} onSizeRangeChange={onSizeRangeChange} />,
		);

		await user.selectOptions(
			screen.getByLabelText("Filtrer par effectif"),
			"100-149",
		);

		expect(onSizeRangeChange).toHaveBeenCalledWith("100-149");
	});
});
