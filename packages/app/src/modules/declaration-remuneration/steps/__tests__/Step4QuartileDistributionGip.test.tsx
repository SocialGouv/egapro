import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	nullGipStep2,
	nullGipStep3,
	nullGipStep4,
	prefilledGipStep4,
} from "~/test/gipGapFixtures";
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

const nullStep2 = nullGipStep2();
const nullStep3 = nullGipStep3();

describe("Step4QuartileDistribution — GIP prefill", () => {
	it("uses gipPrefillData when no initialCategories", () => {
		render(
			<Step4QuartileDistribution
				declarationSiren="123456789"
				declarationYear={2025}
				gipPrefillData={{
					step1: { totalWomen: 100, totalMen: 100 },
					step2: nullStep2,
					step3: nullStep3,
					step4: prefilledGipStep4(),
					confidenceIndex: "0.85",
					periodEnd: "2026-12-31",
				}}
				indicatorGRequired
				initialData={emptyStep4Data()}
			/>,
		);
		const seuilInputs = screen.getAllByLabelText(/Seuil maximum/);
		expect(seuilInputs[0]).toHaveValue("25 000,00");
		const womenCountInputs = screen.getAllByLabelText(/Nombre de femmes/);
		expect(womenCountInputs[0]).toHaveValue("30");
		const menCountInputs = screen.getAllByLabelText(/Nombre d'hommes/);
		expect(menCountInputs[0]).toHaveValue("20");
	});

	it("uses gipPrefillData with partial null thresholds (Q4 has none)", () => {
		render(
			<Step4QuartileDistribution
				declarationSiren="123456789"
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
				indicatorGRequired
				initialData={emptyStep4Data()}
			/>,
		);
		const seuilInputs = screen.getAllByLabelText(/Seuil maximum/);
		expect(seuilInputs[0]).toHaveValue("25 000,00");
		expect(seuilInputs[2]).toHaveValue("40 000,00");
	});

	it("uses gipPrefillData with all null quartile data", () => {
		render(
			<Step4QuartileDistribution
				declarationSiren="123456789"
				declarationYear={2025}
				gipPrefillData={{
					step1: { totalWomen: null, totalMen: null },
					step2: nullStep2,
					step3: nullStep3,
					step4: nullGipStep4(),
					confidenceIndex: null,
					periodEnd: null,
				}}
				indicatorGRequired
				initialData={emptyStep4Data()}
			/>,
		);
		const seuilInputs = screen.getAllByLabelText(/Seuil maximum/);
		for (const input of seuilInputs) {
			expect(input).toHaveValue("");
		}
	});

	it("uses gipPrefillData with mono-gender quartiles (100% women)", () => {
		render(
			<Step4QuartileDistribution
				declarationSiren="123456789"
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
				indicatorGRequired
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

	it("renders the prefilled intro text and DSN source line on both tables", () => {
		render(
			<Step4QuartileDistribution
				declarationSiren="123456789"
				declarationYear={2025}
				gipPrefillData={{
					step1: { totalWomen: 100, totalMen: 100 },
					step2: nullStep2,
					step3: nullStep3,
					step4: prefilledGipStep4(),
					confidenceIndex: "0.85",
					periodEnd: "2026-12-31",
				}}
				indicatorGRequired
				initialData={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getByText(
				"Vérifiez les informations préremplies et modifiez-les si nécessaire avant de valider vos indicateurs.",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByText(
				"Renseignez les informations avant de valider vos indicateurs.",
			),
		).not.toBeInTheDocument();
		expect(
			screen.getAllByText(
				/Source\s*:\s*DSN \(Déclarations Sociales Nominatives\)/,
			).length,
		).toBe(2);
	});
});
