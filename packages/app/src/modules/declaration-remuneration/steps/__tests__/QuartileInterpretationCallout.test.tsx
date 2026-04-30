import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { QuartileData } from "~/modules/declaration-remuneration/types";
import {
	hasHighQuartileImbalance,
	QuartileInterpretationCallout,
} from "../step4/QuartileInterpretationCallout";

function makeCategories(
	overrides: Partial<QuartileData>[] = [],
): QuartileData[] {
	const defaults: QuartileData[] = [
		{ women: 25, men: 25 },
		{ women: 25, men: 25 },
		{ women: 25, men: 25 },
		{ women: 25, men: 25 },
	];
	return defaults.map((cat, i) => ({ ...cat, ...overrides[i] }));
}

describe("QuartileInterpretationCallout", () => {
	it("returns null when categories do not have 4 items", () => {
		const incomplete: QuartileData[] = [{ women: 10, men: 10 }];

		const { container } = render(
			<QuartileInterpretationCallout
				annualCategories={incomplete}
				hourlyCategories={incomplete}
			/>,
		);

		expect(container.innerHTML).toBe("");
	});

	it("returns null when Q4 totals are both 0", () => {
		const annual = makeCategories([{}, {}, {}, { women: 0, men: 0 }]);
		const hourly = makeCategories([{}, {}, {}, { women: 0, men: 0 }]);

		const { container } = render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		expect(container.innerHTML).toBe("");
	});

	it("shows women underrepresented when women ratio < 0.4 in Q4", () => {
		const annual = makeCategories([{}, {}, {}, { women: 2, men: 18 }]);
		const hourly = makeCategories([{}, {}, {}, { women: 3, men: 17 }]);

		render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		expect(
			screen.getByText(/Écart en défaveur des femmes/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/femmes sont nettement moins présentes/),
		).toBeInTheDocument();
	});

	it("shows balanced case when women ratio is between 0.4 and 0.6 in Q4", () => {
		const annual = makeCategories([{}, {}, {}, { women: 10, men: 10 }]);
		const hourly = makeCategories([{}, {}, {}, { women: 10, men: 10 }]);

		render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		expect(
			screen.getByText(/Écart entre hommes et femmes/),
		).toBeInTheDocument();
		expect(screen.getByText(/globalement équilibrée/)).toBeInTheDocument();
	});

	it("shows men underrepresented when women ratio > 0.6 in Q4", () => {
		const annual = makeCategories([{}, {}, {}, { women: 18, men: 2 }]);
		const hourly = makeCategories([{}, {}, {}, { women: 17, men: 3 }]);

		render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		expect(
			screen.getByText(/Écart en défaveur des hommes/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/hommes sont nettement moins présents/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/proches de la parité dans les autres quartiles/),
		).toBeInTheDocument();
	});

	it("flags imbalance at 5pp from parity (44% women → orange)", () => {
		// 44% women is below the 45% threshold → orange
		const annual = makeCategories([{}, {}, {}, { women: 44, men: 56 }]);
		const hourly = makeCategories([{}, {}, {}, { women: 44, men: 56 }]);

		const { container } = render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		const callout = container.querySelector(".fr-callout");
		expect(callout).toHaveClass("fr-callout--orange-terre-battue");
	});
});

describe("hasHighQuartileImbalance", () => {
	it("returns false when categories have less than 4 items", () => {
		expect(hasHighQuartileImbalance([], [])).toBe(false);
	});

	it("returns false when Q4 has no entries", () => {
		const cats = makeCategories([{}, {}, {}, { women: 0, men: 0 }]);
		expect(hasHighQuartileImbalance(cats, cats)).toBe(false);
	});

	it("returns false when Q4 women ratio is between 45% and 55%", () => {
		const cats = makeCategories([{}, {}, {}, { women: 50, men: 50 }]);
		expect(hasHighQuartileImbalance(cats, cats)).toBe(false);
	});

	it("returns true when Q4 women ratio is below 45%", () => {
		const cats = makeCategories([{}, {}, {}, { women: 40, men: 60 }]);
		expect(hasHighQuartileImbalance(cats, cats)).toBe(true);
	});

	it("returns true when Q4 women ratio is above 55%", () => {
		const cats = makeCategories([{}, {}, {}, { women: 60, men: 40 }]);
		expect(hasHighQuartileImbalance(cats, cats)).toBe(true);
	});
});
