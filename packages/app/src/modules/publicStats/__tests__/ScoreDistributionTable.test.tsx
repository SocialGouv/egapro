import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ScoreDistributionBracket } from "../ScoreDistributionChart";
import { ScoreDistributionTable } from "../ScoreDistributionTable";

const sample: ScoreDistributionBracket[] = [
	{ id: "lt50", label: "<50", count: 12, percentage: 1.5 },
	{ id: "80-89", label: "80-89", count: 1234, percentage: 56.3 },
	{ id: "100", label: "100", count: 80, percentage: 7.7 },
	{ id: "nc", label: "NC", count: 0, percentage: 0 },
];

describe("ScoreDistributionTable", () => {
	it("renders one row per bracket with the three labelled columns", () => {
		render(<ScoreDistributionTable brackets={sample} captionId="caption-1" />);

		const table = screen.getByRole("table");
		expect(within(table).getAllByRole("row")).toHaveLength(sample.length + 1);
		expect(within(table).getByText("Tranche de score")).toBeInTheDocument();
		expect(within(table).getByText("Nombre d'entreprises")).toBeInTheDocument();
		expect(within(table).getByText("Part du total")).toBeInTheDocument();
	});

	it("formats counts using French locale (narrow no-break space for thousands)", () => {
		render(<ScoreDistributionTable brackets={sample} captionId="c2" />);
		const cells = screen.getAllByRole("cell");
		const countCell = cells.find((cell) =>
			/1.234/.test(cell.textContent ?? ""),
		);
		expect(countCell).toBeDefined();
	});

	it("formats percentages with one decimal and a percent sign", () => {
		render(<ScoreDistributionTable brackets={sample} captionId="c3" />);
		expect(screen.getByText(/56,3/)).toBeInTheDocument();
		expect(screen.getByText(/7,7/)).toBeInTheDocument();
	});

	it("renders 0 / 0,0 % for empty brackets without breaking", () => {
		render(<ScoreDistributionTable brackets={sample} captionId="c4" />);
		const rows = screen.getAllByRole("row");
		const ncRow = rows.find((row) => /NC/.test(row.textContent ?? ""));
		expect(ncRow?.textContent).toMatch(/0,0/);
	});

	it("labels the table via aria-labelledby pointing at the caption id", () => {
		render(<ScoreDistributionTable brackets={sample} captionId="my-cap" />);
		const table = screen.getByRole("table");
		expect(table).toHaveAttribute("aria-labelledby", "my-cap");
	});

	it("uses scope='row' on the leftmost cell for screen-reader navigation", () => {
		render(<ScoreDistributionTable brackets={sample} captionId="c5" />);
		const rowHeaders = screen.getAllByRole("rowheader");
		expect(rowHeaders).toHaveLength(sample.length);
	});

	it("renders an empty table body when given an empty bracket list", () => {
		render(<ScoreDistributionTable brackets={[]} captionId="c6" />);
		expect(screen.queryAllByRole("rowheader")).toHaveLength(0);
	});
});
