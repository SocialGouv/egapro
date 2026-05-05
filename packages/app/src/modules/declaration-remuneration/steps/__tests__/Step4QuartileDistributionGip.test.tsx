import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Step4QuartileDistribution } from "../Step4QuartileDistribution";

const mockMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateStep4: {
				useMutation: () => ({
					mutate: mockMutate,
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

const emptyStep4Data = () => ({
	annual: [
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
	],
	hourly: [
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
	],
});

const nullStep2 = {
	annualMeanWomen: null,
	annualMeanMen: null,
	hourlyMeanWomen: null,
	hourlyMeanMen: null,
	annualMedianWomen: null,
	annualMedianMen: null,
	hourlyMedianWomen: null,
	hourlyMedianMen: null,
};

const nullStep3 = {
	annualMeanWomen: null,
	annualMeanMen: null,
	hourlyMeanWomen: null,
	hourlyMeanMen: null,
	annualMedianWomen: null,
	annualMedianMen: null,
	hourlyMedianWomen: null,
	hourlyMedianMen: null,
	beneficiaryCountWomen: null,
	beneficiaryCountMen: null,
};

describe("Step4QuartileDistribution — GIP prefill", () => {
	it("uses gipPrefillData when no initialCategories", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				gipPrefillData={{
					step1: { totalWomen: 100, totalMen: 100 },
					step2: nullStep2,
					step3: nullStep3,
					step4: {
						annual: {
							thresholds: ["25000", "32000", "40000"],
							womenCounts: [30, 25, 20, 15],
							menCounts: [20, 25, 30, 35],
						},
						hourly: {
							thresholds: ["13.74", "17.58", "21.98"],
							womenCounts: [28, 22, 18, 12],
							menCounts: [22, 28, 32, 38],
						},
					},
					confidenceIndex: "0.85",
					periodEnd: "2026-12-31",
				}}
				initialData={emptyStep4Data()}
			/>,
		);
		const remuInputs = screen.getAllByLabelText(/Rémunération brute/);
		expect(remuInputs[0]).toHaveValue("25 000");
		const womenCountInputs = screen.getAllByLabelText(/Nombre de femmes/);
		expect(womenCountInputs[0]).toHaveValue("30");
		const menCountInputs = screen.getAllByLabelText(/Nombre d'hommes/);
		expect(menCountInputs[0]).toHaveValue("20");
	});

	it("uses gipPrefillData with partial null thresholds (Q4 has none)", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				gipPrefillData={{
					step1: { totalWomen: 100, totalMen: 100 },
					step2: nullStep2,
					step3: nullStep3,
					step4: {
						annual: {
							thresholds: ["25000", "32000", "40000"],
							womenCounts: [30, 25, 20, null],
							menCounts: [20, 25, 30, null],
						},
						hourly: {
							thresholds: ["13.74", "17.58", "21.98"],
							womenCounts: [28, 22, 18, null],
							menCounts: [22, 28, 32, null],
						},
					},
					confidenceIndex: null,
					periodEnd: null,
				}}
				initialData={emptyStep4Data()}
			/>,
		);
		const remuInputs = screen.getAllByLabelText(/Rémunération brute/);
		expect(remuInputs[0]).toHaveValue("25 000");
		expect(remuInputs[2]).toHaveValue("40 000");
		expect(remuInputs[3]).toHaveValue("");
	});

	it("uses gipPrefillData with all null quartile data", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				gipPrefillData={{
					step1: { totalWomen: null, totalMen: null },
					step2: nullStep2,
					step3: nullStep3,
					step4: {
						annual: {
							thresholds: [null, null, null],
							womenCounts: [null, null, null, null],
							menCounts: [null, null, null, null],
						},
						hourly: {
							thresholds: [null, null, null],
							womenCounts: [null, null, null, null],
							menCounts: [null, null, null, null],
						},
					},
					confidenceIndex: null,
					periodEnd: null,
				}}
				initialData={emptyStep4Data()}
			/>,
		);
		const remuInputs = screen.getAllByLabelText(/Rémunération brute/);
		for (const input of remuInputs) {
			expect(input).toHaveValue("");
		}
	});

	it("uses gipPrefillData with mono-gender quartiles (100% women)", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				gipPrefillData={{
					step1: { totalWomen: 200, totalMen: 0 },
					step2: nullStep2,
					step3: nullStep3,
					step4: {
						annual: {
							thresholds: ["25000", "32000", "40000"],
							womenCounts: [50, 50, 50, 50],
							menCounts: [0, 0, 0, 0],
						},
						hourly: {
							thresholds: ["13.74", "17.58", "21.98"],
							womenCounts: [50, 50, 50, 50],
							menCounts: [0, 0, 0, 0],
						},
					},
					confidenceIndex: null,
					periodEnd: null,
				}}
				initialData={emptyStep4Data()}
			/>,
		);
		const womenCountInputs = screen.getAllByLabelText(/Nombre de femmes/);
		expect(womenCountInputs[0]).toHaveValue("50");
		const menCountInputs = screen.getAllByLabelText(/Nombre d'hommes/);
		expect(menCountInputs[0]).toHaveValue("0");

		// Total men column should display "0", not "-" (0 is valid data, not absence)
		const totalCells = screen.getAllByRole("cell");
		const menTotalCells = totalCells.filter((cell) => cell.textContent === "0");
		expect(menTotalCells.length).toBeGreaterThanOrEqual(1);
	});
});
