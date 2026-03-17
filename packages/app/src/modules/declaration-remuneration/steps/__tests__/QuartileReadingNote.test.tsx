import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StepCategoryData } from "~/modules/declaration-remuneration/types";
import { QuartileReadingNote } from "../step4/QuartileReadingNote";

const categories: StepCategoryData[] = [
	{ name: "1er quartile", womenCount: 19, menCount: 22, womenValue: "980" },
	{ name: "2e quartile", womenCount: 17, menCount: 19, womenValue: "1450" },
	{ name: "3e quartile", womenCount: 14, menCount: 17, womenValue: "1750" },
	{ name: "4e quartile", womenCount: 5, menCount: 10, womenValue: "2300" },
];

describe("QuartileReadingNote", () => {
	it("uses Q1 (index 0) in annual mode", () => {
		render(
			<QuartileReadingNote
				categories={categories}
				tableType="annual"
				year={2025}
			/>,
		);

		expect(screen.getByText(/un salarié sur quatre/)).toBeInTheDocument();
		expect(screen.getByText(/980/)).toBeInTheDocument();
		expect(
			screen.getByText(/rémunération annuelle brute moyenne/),
		).toBeInTheDocument();
	});

	it("uses Q2 (index 1) in hourly mode", () => {
		render(
			<QuartileReadingNote
				categories={categories}
				tableType="hourly"
				year={2025}
			/>,
		);

		expect(screen.getByText(/un salarié sur deux/)).toBeInTheDocument();
		expect(screen.getByText(/1.450/)).toBeInTheDocument();
		expect(
			screen.getByText(/rémunération horaire brute moyenne/),
		).toBeInTheDocument();
	});

	it("returns null when categories is empty", () => {
		const { container } = render(
			<QuartileReadingNote categories={[]} tableType="annual" year={2025} />,
		);

		expect(container.innerHTML).toBe("");
	});

	it("returns null when total is 0", () => {
		const zeroCategories: StepCategoryData[] = [
			{ name: "1er quartile", womenCount: 0, menCount: 0, womenValue: "980" },
			{ name: "2e quartile", womenCount: 0, menCount: 0, womenValue: "1450" },
		];

		const { container } = render(
			<QuartileReadingNote
				categories={zeroCategories}
				tableType="annual"
				year={2025}
			/>,
		);

		expect(container.innerHTML).toBe("");
	});
});
