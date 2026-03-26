import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step4QuartileDistribution } from "../Step4QuartileDistribution";

const mockMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateStepCategories: {
				useMutation: () => ({
					mutate: mockMutate,
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

describe("Step4QuartileDistribution", () => {
	it("renders two tables with quartile columns", () => {
		render(<Step4QuartileDistribution />);
		expect(
			screen.getByText("Rémunération annuelle brute moyenne", {
				selector: "h3",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText("Rémunération horaire brute moyenne", {
				selector: "h3",
			}),
		).toBeInTheDocument();
		expect(
			screen.getAllByText(/quartile/, { selector: "th" }).length,
		).toBeGreaterThanOrEqual(8);
		expect(screen.getAllByText(/les salariés/, { selector: "th" }).length).toBe(
			2,
		);
	});

	it("renders all row labels in both tables", () => {
		render(<Step4QuartileDistribution />);
		expect(screen.getAllByText(/annuelle brute/).length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText(/horaire brute/).length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText(/de femmes/).length).toBeGreaterThanOrEqual(4);
		expect(screen.getAllByText(/d'hommes/).length).toBeGreaterThanOrEqual(4);
	});

	it("renders description text about quartiles", () => {
		render(<Step4QuartileDistribution />);
		expect(
			screen.getByText(/compare la proportion de femmes et d'hommes/),
		).toBeInTheDocument();
	});

	it("renders instruction text and mandatory fields notice", () => {
		render(<Step4QuartileDistribution />);
		expect(
			screen.getByText(
				"Renseignez les informations avant de valider vos indicateurs.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les champs sont obligatoires."),
		).toBeInTheDocument();
	});

	it("displays pre-filled data with computed percentages", () => {
		render(
			<Step4QuartileDistribution
				initialAnnualCategories={[
					{
						name: "1er quartile",
						womenCount: 19,
						menCount: 22,
						womenValue: "980",
					},
					{
						name: "2e quartile",
						womenCount: 17,
						menCount: 19,
						womenValue: "1450",
					},
					{
						name: "3e quartile",
						womenCount: 14,
						menCount: 17,
						womenValue: "1750",
					},
					{
						name: "4e quartile",
						womenCount: 5,
						menCount: 10,
						womenValue: "2300",
					},
				]}
				initialHourlyCategories={[
					{ name: "1er quartile", womenValue: "7.2" },
					{ name: "2e quartile", womenValue: "10.12" },
					{ name: "3e quartile", womenValue: "12.92" },
					{ name: "4e quartile", womenValue: "14.93" },
				]}
			/>,
		);

		// Check annual remuneration inputs have values
		const remuInputs = screen.getAllByLabelText(/Rémunération brute/);
		expect(remuInputs[0]).toHaveValue("980");

		// Check annual women count inputs
		const womenCountInputs = screen.getAllByLabelText(/Nombre de femmes/);
		expect(womenCountInputs[0]).toHaveValue("19");

		// Check annual total column (55 women, 68 men)
		expect(screen.getAllByText("55").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("68").length).toBeGreaterThanOrEqual(1);
	});

	it("shows SavedIndicator when initialCategories have data", () => {
		render(
			<Step4QuartileDistribution
				initialAnnualCategories={[
					{ name: "1er quartile", womenCount: 10, menCount: 15 },
					{ name: "2e quartile" },
					{ name: "3e quartile" },
					{ name: "4e quartile" },
				]}
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator when no initial data", () => {
		render(<Step4QuartileDistribution />);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("renders inline inputs for remuneration, women count, and men count", () => {
		render(<Step4QuartileDistribution />);
		// 4 quartiles × 2 tables = 8 inputs per row type
		expect(screen.getAllByLabelText(/Rémunération brute/).length).toBe(8);
		expect(screen.getAllByLabelText(/Nombre de femmes/).length).toBe(8);
		expect(screen.getAllByLabelText(/Nombre d'hommes/).length).toBe(8);
	});

	it("updates remuneration values via inline inputs", async () => {
		const user = userEvent.setup();
		render(<Step4QuartileDistribution />);

		const remuInputs = screen.getAllByLabelText(/Rémunération brute/);
		const q1Input = remuInputs[0] as HTMLInputElement;

		await user.clear(q1Input);
		await user.type(q1Input, "980");
		expect(q1Input).toHaveValue("980");
	});

	it("rejects negative values in remuneration inputs", async () => {
		const user = userEvent.setup();
		render(<Step4QuartileDistribution />);

		const remuInputs = screen.getAllByLabelText(/Rémunération brute/);
		const q1Input = remuInputs[0] as HTMLInputElement;

		await user.clear(q1Input);
		await user.type(q1Input, "-50");
		expect(q1Input).not.toHaveValue("-50");
	});

	it("blocks count exceeding max workforce", async () => {
		const user = userEvent.setup();
		render(<Step4QuartileDistribution maxMen={25} maxWomen={15} />);

		const womenInputs = screen.getAllByLabelText(/Nombre de femmes/);
		const q1Input = womenInputs[0] as HTMLInputElement;

		await user.clear(q1Input);
		await user.type(q1Input, "20");

		expect(screen.getByText(/ne peut pas dépasser/i)).toBeInTheDocument();
	});

	it("renders accordion", () => {
		render(<Step4QuartileDistribution />);
		expect(
			screen.getByText("Définitions et méthode de calcul"),
		).toBeInTheDocument();
	});

	it("renders previous link pointing to step 3", () => {
		render(<Step4QuartileDistribution />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/3",
		);
	});

	it("uses gipPrefillData when no initialCategories", () => {
		render(
			<Step4QuartileDistribution
				gipPrefillData={{
					step1: { totalWomen: 100, totalMen: 100 },
					step2: {
						annualMeanWomen: null,
						annualMeanMen: null,
						hourlyMeanWomen: null,
						hourlyMeanMen: null,
						annualMedianWomen: null,
						annualMedianMen: null,
						hourlyMedianWomen: null,
						hourlyMedianMen: null,
					},
					step3: {
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
					},
					step4: {
						annual: {
							thresholds: ["25000", "32000", "40000", "55000"],
							womenCounts: [30, 25, 20, 15],
							menCounts: [20, 25, 30, 35],
						},
						hourly: {
							thresholds: ["13.74", "17.58", "21.98", "30.22"],
							womenCounts: [28, 22, 18, 12],
							menCounts: [22, 28, 32, 38],
						},
					},
					confidenceIndex: "0.85",
					periodEnd: "2026-12-31",
				}}
			/>,
		);
		// Check annual remuneration inputs have prefilled values
		const remuInputs = screen.getAllByLabelText(/Rémunération brute/);
		expect(remuInputs[0]).toHaveValue("25\u202f000");
		// Check women count inputs
		const womenCountInputs = screen.getAllByLabelText(/Nombre de femmes/);
		expect(womenCountInputs[0]).toHaveValue(30);
		// Check men count inputs
		const menCountInputs = screen.getAllByLabelText(/Nombre d'hommes/);
		expect(menCountInputs[0]).toHaveValue(20);
	});

	it("uses gipPrefillData with null Q4 threshold", () => {
		render(
			<Step4QuartileDistribution
				gipPrefillData={{
					step1: { totalWomen: 100, totalMen: 100 },
					step2: {
						annualMeanWomen: null,
						annualMeanMen: null,
						hourlyMeanWomen: null,
						hourlyMeanMen: null,
						annualMedianWomen: null,
						annualMedianMen: null,
						hourlyMedianWomen: null,
						hourlyMedianMen: null,
					},
					step3: {
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
					},
					step4: {
						annual: {
							thresholds: ["25000", "32000", "40000", null],
							womenCounts: [30, 25, 20, null],
							menCounts: [20, 25, 30, null],
						},
						hourly: {
							thresholds: ["13.74", "17.58", "21.98", null],
							womenCounts: [28, 22, 18, null],
							menCounts: [22, 28, 32, null],
						},
					},
					confidenceIndex: null,
					periodEnd: null,
				}}
			/>,
		);
		// First 3 quartiles should be prefilled
		const remuInputs = screen.getAllByLabelText(/Rémunération brute/);
		expect(remuInputs[0]).toHaveValue("25\u202f000");
		expect(remuInputs[2]).toHaveValue("40\u202f000");
		// Q4 should be empty (null threshold)
		expect(remuInputs[3]).toHaveValue("");
	});

	it("uses gipPrefillData with all null quartile data", () => {
		render(
			<Step4QuartileDistribution
				gipPrefillData={{
					step1: { totalWomen: null, totalMen: null },
					step2: {
						annualMeanWomen: null,
						annualMeanMen: null,
						hourlyMeanWomen: null,
						hourlyMeanMen: null,
						annualMedianWomen: null,
						annualMedianMen: null,
						hourlyMedianWomen: null,
						hourlyMedianMen: null,
					},
					step3: {
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
					},
					step4: {
						annual: {
							thresholds: [null, null, null, null],
							womenCounts: [null, null, null, null],
							menCounts: [null, null, null, null],
						},
						hourly: {
							thresholds: [null, null, null, null],
							womenCounts: [null, null, null, null],
							menCounts: [null, null, null, null],
						},
					},
					confidenceIndex: null,
					periodEnd: null,
				}}
			/>,
		);
		// All inputs should be empty
		const remuInputs = screen.getAllByLabelText(/Rémunération brute/);
		for (const input of remuInputs) {
			expect(input).toHaveValue("");
		}
	});

	it("uses gipPrefillData with mono-gender quartiles (100% women)", () => {
		render(
			<Step4QuartileDistribution
				gipPrefillData={{
					step1: { totalWomen: 200, totalMen: 0 },
					step2: {
						annualMeanWomen: null,
						annualMeanMen: null,
						hourlyMeanWomen: null,
						hourlyMeanMen: null,
						annualMedianWomen: null,
						annualMedianMen: null,
						hourlyMedianWomen: null,
						hourlyMedianMen: null,
					},
					step3: {
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
					},
					step4: {
						annual: {
							thresholds: ["25000", "32000", "40000", "55000"],
							womenCounts: [50, 50, 50, 50],
							menCounts: [0, 0, 0, 0],
						},
						hourly: {
							thresholds: ["13.74", "17.58", "21.98", "30.22"],
							womenCounts: [50, 50, 50, 50],
							menCounts: [0, 0, 0, 0],
						},
					},
					confidenceIndex: null,
					periodEnd: null,
				}}
			/>,
		);
		const womenCountInputs = screen.getAllByLabelText(/Nombre de femmes/);
		expect(womenCountInputs[0]).toHaveValue(50);
		const menCountInputs = screen.getAllByLabelText(/Nombre d'hommes/);
		expect(menCountInputs[0]).toHaveValue(0);

		// Total men column should display "0", not "-" (0 is valid data, not absence)
		const totalCells = screen.getAllByRole("cell");
		const menTotalCells = totalCells.filter((cell) => cell.textContent === "0");
		expect(menTotalCells.length).toBeGreaterThanOrEqual(1);
	});
});
