import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MultiYearGapTable } from "../MultiYearGapTable";

describe("MultiYearGapTable", () => {
	it("renders nothing when the series list is empty", () => {
		const { container } = render(<MultiYearGapTable series={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders one column header per year, sorted ascending", () => {
		render(
			<MultiYearGapTable
				series={[
					{
						segment: "Global",
						points: [
							{ year: 2026, avgGap: 4.2, sampleSize: 1000 },
							{ year: 2024, avgGap: 5, sampleSize: 800 },
							{ year: 2025, avgGap: 4.7, sampleSize: 900 },
						],
					},
				]}
			/>,
		);

		const columnHeaders = screen
			.getAllByRole("columnheader")
			.filter((h) => h.textContent !== "Segment")
			.map((h) => h.textContent);
		expect(columnHeaders).toEqual(["2024", "2025", "2026"]);
	});

	it("renders one data row per segment with formatted gap + sample size", () => {
		render(
			<MultiYearGapTable
				series={[
					{
						segment: "C",
						points: [{ year: 2026, avgGap: 4.2, sampleSize: 1200 }],
					},
					{
						segment: "G",
						points: [{ year: 2026, avgGap: 3.8, sampleSize: 500 }],
					},
				]}
			/>,
		);

		expect(screen.getByRole("rowheader", { name: "C" })).toBeInTheDocument();
		expect(screen.getByRole("rowheader", { name: "G" })).toBeInTheDocument();
		// Formatting combines gap + sample size; match both pieces leniently to
		// accommodate the narrow no-break space in the French thousand separator.
		expect(screen.getByText(/4,2 %.*sur.*1.*200/)).toBeInTheDocument();
		expect(screen.getByText(/3,8 %.*sur.*500/)).toBeInTheDocument();
	});

	it("renders an em-dash for missing points", () => {
		render(
			<MultiYearGapTable
				series={[
					{
						segment: "Global",
						points: [
							{ year: 2025, avgGap: 5, sampleSize: 100 },
							{ year: 2026, avgGap: null, sampleSize: 0 },
						],
					},
				]}
			/>,
		);

		const dashes = screen
			.getAllByRole("cell")
			.filter((c) => c.textContent === "—");
		expect(dashes).toHaveLength(1);
	});
});
