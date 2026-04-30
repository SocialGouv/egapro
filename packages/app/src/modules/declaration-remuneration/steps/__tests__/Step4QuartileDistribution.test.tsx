import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
		{ threshold: undefined },
	],
	hourly: [
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: undefined },
	],
});

describe("Step4QuartileDistribution", () => {
	it("renders two tables with quartile rows and inverted columns", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
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
		// Q1..Q4 row labels per table → 8 rows (excluding total row "Tous les salariés")
		expect(
			screen
				.getAllByRole("rowheader")
				.filter((cell) => /quartile/.test(cell.textContent ?? "")),
		).toHaveLength(8);
		// Total row "Tous les salariés" shows in both tables
		expect(screen.getAllByText(/Tous les salariés/).length).toBe(2);
	});

	it("renders renumeration tranche header and Pourcentage columns", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		const headers = screen.getAllByRole("columnheader");
		const annualHeader = headers.find((h) =>
			/Tranche de rémunération[\s\S]*annuelle brute/.test(h.textContent ?? ""),
		);
		expect(annualHeader).toBeDefined();
		const hourlyHeader = headers.find((h) =>
			/Tranche de rémunération[\s\S]*horaire brute/.test(h.textContent ?? ""),
		);
		expect(hourlyHeader).toBeDefined();
		expect(screen.getAllByText(/Pourcentage/).length).toBeGreaterThanOrEqual(4);
	});

	it("renders description text about quartiles", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getByText(/répartit l'ensemble des salariés en quatre groupes/),
		).toBeInTheDocument();
	});

	it("renders instruction text and mandatory fields notice", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getByText(
				"Renseignez les informations avant de valider vos indicateurs.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les champs sont obligatoires."),
		).toBeInTheDocument();
	});

	it("displays empty state with all min = - € and Q4 max = - €", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		const dashCells = screen
			.getAllByRole("cell")
			.filter((c) => c.textContent === "- €");
		expect(dashCells.length).toBeGreaterThanOrEqual(10);
	});

	it("renders 3 threshold inputs per table (Q1/Q2/Q3 only) and Q4 readonly", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		// 3 threshold inputs per table × 2 tables = 6
		expect(screen.getAllByLabelText(/Seuil maximum/i).length).toBe(6);
		// Q4 max is readonly (not an input)
		expect(
			screen.queryByLabelText(/Seuil maximum 4e quartile/i),
		).not.toBeInTheDocument();
	});

	it("renders 4 women and 4 men count inputs per table", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		expect(screen.getAllByLabelText(/Nombre de femmes/).length).toBe(8);
		expect(screen.getAllByLabelText(/Nombre d'hommes/).length).toBe(8);
	});

	it("displays cascade lower bounds live when seuil1 is filled", async () => {
		const user = userEvent.setup();
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		const seuil1 = screen.getAllByLabelText(
			/Seuil maximum 1er quartile annuel/i,
		)[0] as HTMLInputElement;
		await user.clear(seuil1);
		await user.type(seuil1, "20000");
		// Q2 min should now show "20 000,01 €"
		expect(
			screen.getByText((c) => c.replace(/\s/g, " ") === "20 000,01 €"),
		).toBeInTheDocument();
	});

	it("rejects negative values in threshold inputs", async () => {
		const user = userEvent.setup();
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		const seuil1 = screen.getAllByLabelText(
			/Seuil maximum 1er quartile annuel/i,
		)[0] as HTMLInputElement;
		await user.clear(seuil1);
		await user.type(seuil1, "-50");
		expect(seuil1).not.toHaveValue("-50");
	});

	it("blocks count exceeding max workforce", async () => {
		const user = userEvent.setup();
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
				maxMen={25}
				maxWomen={15}
			/>,
		);
		const womenInput = screen.getAllByLabelText(
			/Nombre de femmes 1er quartile annuel/i,
		)[0] as HTMLInputElement;
		await user.clear(womenInput);
		await user.type(womenInput, "20");
		expect(screen.getByText(/ne peut pas dépasser/i)).toBeInTheDocument();
	});

	it("renders mobile-label attributes on data cells for responsive reflow", () => {
		const { container } = render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		// Each quartile row carries data-mobile-label on its data cells
		// (Minimum, Maximum, Nombre de femmes, Nombre d'hommes, % de femmes, % d'hommes)
		const labels = container.querySelectorAll("[data-mobile-label]");
		// 4 rows × 6 cells × 2 tables = 48; total row adds 4 cells × 2 = 8 → 56
		expect(labels.length).toBeGreaterThanOrEqual(48);
		expect(
			container.querySelector('[data-mobile-label="Minimum"]'),
		).toBeInTheDocument();
		expect(
			container.querySelector('[data-mobile-label="Maximum"]'),
		).toBeInTheDocument();
		expect(
			container.querySelector('[data-mobile-label="Pourcentage de femmes"]'),
		).toBeInTheDocument();
	});

	it("renders DSN source line on both tables even without GIP prefill", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getAllByText(
				/Source\s*:\s*DSN \(Déclarations Sociales Nominatives\)/,
			).length,
		).toBe(2);
	});

	it("renders accordion", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getByText("Définitions et méthode de calcul"),
		).toBeInTheDocument();
	});

	it("renders previous link pointing to step 3", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/3",
		);
	});

	it("uses gipPrefillData to pre-populate 3 thresholds and counts", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
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
							womenCounts: [30, 25, 20, 15],
							menCounts: [20, 25, 30, 35],
						},
						hourly: {
							thresholds: ["13.74", "17.58", "21.98", null],
							womenCounts: [28, 22, 18, 12],
							menCounts: [22, 28, 32, 38],
						},
					},
					confidenceIndex: "0.85",
					periodStart: "2026-01-01",
					periodEnd: "2026-12-31",
				}}
				initialData={emptyStep4Data()}
			/>,
		);
		const seuilInputs = screen.getAllByLabelText(/Seuil maximum/);
		expect(seuilInputs[0]).toHaveValue("25 000");
		const womenCountInputs = screen.getAllByLabelText(/Nombre de femmes/);
		expect(womenCountInputs[0]).toHaveValue("30");
		const menCountInputs = screen.getAllByLabelText(/Nombre d'hommes/);
		expect(menCountInputs[0]).toHaveValue("20");
	});

	it("uses gipPrefillData with all null quartile data", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
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
					periodStart: null,
					periodEnd: null,
				}}
				initialData={emptyStep4Data()}
			/>,
		);
		const seuilInputs = screen.getAllByLabelText(/Seuil maximum/);
		for (const input of seuilInputs) {
			expect(input).toHaveValue("");
		}
	});

	it("displays computed percentages for prefilled data", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={{
					annual: [
						{ threshold: "20000", women: 60, men: 30 },
						{ threshold: "25000", women: 40, men: 30 },
						{ threshold: "35000", women: 24, men: 31 },
						{ threshold: undefined, women: 15, men: 26 },
					],
					hourly: [
						{ threshold: "10", women: 20, men: 23 },
						{ threshold: "12", women: 16, men: 18 },
						{ threshold: "15", women: 15, men: 18 },
						{ threshold: undefined, women: 4, men: 9 },
					],
				}}
			/>,
		);
		// Annual: total = 90 women + 117 men → 139/256 ≈ 54,3%
		expect(screen.getAllByText(/66,7 %/).length).toBeGreaterThanOrEqual(1);
	});

	it("shows SavedIndicator when initialData has data", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={{
					annual: [
						{ threshold: "", women: 10, men: 15 },
						{ threshold: "" },
						{ threshold: "" },
						{ threshold: undefined },
					],
					hourly: [
						{ threshold: "" },
						{ threshold: "" },
						{ threshold: "" },
						{ threshold: undefined },
					],
				}}
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator when no initial data", () => {
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});
});
