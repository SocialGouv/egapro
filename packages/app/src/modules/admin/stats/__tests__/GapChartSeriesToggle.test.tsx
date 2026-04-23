import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GapChartSeriesToggle } from "../GapChartSeriesToggle";

describe("GapChartSeriesToggle", () => {
	it("renders one checkbox per segment, all checked by default", () => {
		render(
			<GapChartSeriesToggle
				hiddenSegments={new Set()}
				onChange={vi.fn()}
				segments={["Global", "<50", "250+"]}
			/>,
		);

		const checkboxes = screen.getAllByRole<HTMLInputElement>("checkbox");
		expect(checkboxes).toHaveLength(3);
		for (const cb of checkboxes) expect(cb.checked).toBe(true);
	});

	it("reflects the hiddenSegments prop as unchecked boxes", () => {
		render(
			<GapChartSeriesToggle
				hiddenSegments={new Set(["<50"])}
				onChange={vi.fn()}
				segments={["Global", "<50", "250+"]}
			/>,
		);

		expect(
			screen.getByRole<HTMLInputElement>("checkbox", { name: "<50" }).checked,
		).toBe(false);
		expect(
			screen.getByRole<HTMLInputElement>("checkbox", { name: "Global" })
				.checked,
		).toBe(true);
	});

	it("adds a segment to the hidden set when the user unchecks it", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(
			<GapChartSeriesToggle
				hiddenSegments={new Set()}
				onChange={onChange}
				segments={["Global", "<50"]}
			/>,
		);

		await user.click(screen.getByRole("checkbox", { name: "<50" }));

		expect(onChange).toHaveBeenCalledTimes(1);
		const next = onChange.mock.calls[0]?.[0] as ReadonlySet<string>;
		expect(next.has("<50")).toBe(true);
		expect(next.has("Global")).toBe(false);
	});

	it("removes a segment from the hidden set when the user re-checks it", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(
			<GapChartSeriesToggle
				hiddenSegments={new Set(["<50"])}
				onChange={onChange}
				segments={["Global", "<50"]}
			/>,
		);

		await user.click(screen.getByRole("checkbox", { name: "<50" }));

		const next = onChange.mock.calls[0]?.[0] as ReadonlySet<string>;
		expect(next.has("<50")).toBe(false);
	});

	it("associates the legend hint via aria-describedby", () => {
		render(
			<GapChartSeriesToggle
				hiddenSegments={new Set()}
				idPrefix="custom-prefix"
				onChange={vi.fn()}
				segments={["Global"]}
			/>,
		);

		const fieldset = screen.getByRole("group", { name: /Séries affichées/i });
		expect(fieldset).toHaveAttribute("aria-describedby", "custom-prefix-hint");
	});
});
