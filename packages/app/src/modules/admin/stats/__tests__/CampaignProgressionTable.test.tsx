import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CampaignProgressionTable } from "../CampaignProgressionTable";

describe("CampaignProgressionTable", () => {
	it("renders nothing when there are no series", () => {
		const { container } = render(<CampaignProgressionTable series={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("lists days sorted chronologically and one column per year", () => {
		render(
			<CampaignProgressionTable
				series={[
					{
						year: 2025,
						points: [
							{ day: "2025-01-05", cumulative: 10 },
							{ day: "2025-01-08", cumulative: 15 },
						],
					},
					{
						year: 2026,
						points: [
							{ day: "2026-01-06", cumulative: 8 },
							{ day: "2026-01-08", cumulative: 20 },
						],
					},
				]}
			/>,
		);

		const headers = screen
			.getAllByRole("columnheader")
			.map((el) => el.textContent);
		expect(headers).toEqual(["Jour", "2025", "2026"]);

		const rows = screen.getAllByRole("row");
		// header row + 3 day rows (05, 06, 08)
		expect(rows).toHaveLength(4);
		const dayHeaders = rows
			.slice(1)
			.map((row) => within(row).getByRole("rowheader").textContent);
		expect(dayHeaders).toEqual(["05/01", "06/01", "08/01"]);
	});

	it("formats cumulative counts with French thousand separators", () => {
		render(
			<CampaignProgressionTable
				series={[
					{
						year: 2026,
						points: [{ day: "2026-02-15", cumulative: 7842 }],
					},
				]}
			/>,
		);

		// Non-breaking space (U+202F) is what `Intl.NumberFormat('fr-FR')` uses
		expect(screen.getByRole("cell").textContent).toBe("7 842");
	});

	it("shows an em dash when a year has no value for a given day", () => {
		render(
			<CampaignProgressionTable
				series={[
					{ year: 2025, points: [{ day: "2025-01-05", cumulative: 10 }] },
					{ year: 2026, points: [{ day: "2026-01-08", cumulative: 20 }] },
				]}
			/>,
		);

		const cells = screen.getAllByRole("cell").map((el) => el.textContent);
		// 2 rows × 2 data columns = 4 cells; 05/01→(10, —), 08/01→(—, 20)
		expect(cells).toContain("—");
	});
});
