import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { QuartileData } from "~/modules/declaration-remuneration/types";
import { QuartileReadingNote } from "../step4/QuartileReadingNote";

const categories: QuartileData[] = [
	{ threshold: "980", women: 19, men: 22 },
	{ threshold: "1450", women: 17, men: 19 },
	{ threshold: "1750", women: 14, men: 17 },
	{ threshold: "2300", women: 5, men: 10 },
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
		const zeroCategories: QuartileData[] = [
			{ threshold: "980", women: 0, men: 0 },
			{ threshold: "1450", women: 0, men: 0 },
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
