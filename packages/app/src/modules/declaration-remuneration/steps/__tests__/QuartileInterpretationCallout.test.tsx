import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StepCategoryData } from "~/modules/declaration-remuneration/types";
import { QuartileInterpretationCallout } from "../step4/QuartileInterpretationCallout";

function makeCategories(
	overrides: Partial<StepCategoryData>[] = [],
): StepCategoryData[] {
	const defaults: StepCategoryData[] = [
		{ name: "1er quartile", womenCount: 25, menCount: 25 },
		{ name: "2e quartile", womenCount: 25, menCount: 25 },
		{ name: "3e quartile", womenCount: 25, menCount: 25 },
		{ name: "4e quartile", womenCount: 25, menCount: 25 },
	];
	return defaults.map((cat, i) => ({ ...cat, ...overrides[i] }));
}

describe("QuartileInterpretationCallout", () => {
	it("returns null when categories do not have 4 items", () => {
		const incomplete: StepCategoryData[] = [
			{ name: "1er quartile", womenCount: 10, menCount: 10 },
		];

		const { container } = render(
			<QuartileInterpretationCallout
				annualCategories={incomplete}
				hourlyCategories={incomplete}
			/>,
		);

		expect(container.innerHTML).toBe("");
	});

	it("returns null when Q4 totals are both 0", () => {
		const annual = makeCategories([{}, {}, {}, { womenCount: 0, menCount: 0 }]);
		const hourly = makeCategories([{}, {}, {}, { womenCount: 0, menCount: 0 }]);

		const { container } = render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		expect(container.innerHTML).toBe("");
	});

	it("shows women underrepresented when women ratio < 0.4 in Q4", () => {
		const annual = makeCategories([
			{},
			{},
			{},
			{ womenCount: 2, menCount: 18 },
		]);
		const hourly = makeCategories([
			{},
			{},
			{},
			{ womenCount: 3, menCount: 17 },
		]);

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
		const annual = makeCategories([
			{},
			{},
			{},
			{ womenCount: 10, menCount: 10 },
		]);
		const hourly = makeCategories([
			{},
			{},
			{},
			{ womenCount: 10, menCount: 10 },
		]);

		render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		expect(
			screen.getByText(/Équilibre entre hommes et femmes/),
		).toBeInTheDocument();
		expect(screen.getByText(/relativement équilibrée/)).toBeInTheDocument();
	});

	it("shows men underrepresented when women ratio > 0.6 in Q4", () => {
		const annual = makeCategories([
			{},
			{},
			{},
			{ womenCount: 18, menCount: 2 },
		]);
		const hourly = makeCategories([
			{},
			{},
			{},
			{ womenCount: 17, menCount: 3 },
		]);

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
	});
});
