import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { Step6Review } from "../Step6Review";

vi.mock("~/modules/declarationPdf", () => ({
	DownloadDeclarationPdfButton: () => (
		<a href="/api/declaration-pdf">Télécharger le récapitulatif (PDF)</a>
	),
}));

const mockSubmitMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			submit: {
				useMutation: () => ({
					mutate: mockSubmitMutate,
					isPending: false,
					error: null,
				}),
			},
		},
		company: {
			updateHasCse: {
				useMutation: () => ({
					mutate: vi.fn(),
					isPending: false,
				}),
			},
		},
	},
}));

function makeCategory(
	overrides: Partial<EmployeeCategoryRow> = {},
): EmployeeCategoryRow {
	return {
		name: "",
		detail: "",
		womenCount: null,
		menCount: null,
		annualBaseWomen: null,
		annualBaseMen: null,
		annualVariableWomen: null,
		annualVariableMen: null,
		hourlyBaseWomen: null,
		hourlyBaseMen: null,
		hourlyVariableWomen: null,
		hourlyVariableMen: null,
		...overrides,
	};
}

describe("Step6Review", () => {
	it("renders title and stepper at step 6", () => {
		render(<Step6Review />);
		expect(screen.getByText("Étape 6 sur 6")).toBeInTheDocument();
		expect(
			screen.getByText(/Déclaration des indicateurs de rémunération/),
		).toBeInTheDocument();
	});

	it("renders description text", () => {
		render(<Step6Review />);
		expect(
			screen.getByText(/Vérifiez que toutes les informations/),
		).toBeInTheDocument();
	});

	it("renders section headings", () => {
		render(<Step6Review />);
		expect(
			screen.getByText("Indicateurs pour l'ensemble de vos salariés"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Indicateurs par catégorie de salariés"),
		).toBeInTheDocument();
	});

	it("renders SavedIndicator", () => {
		render(<Step6Review />);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("renders all 4 recap card titles", () => {
		render(<Step6Review />);
		expect(
			screen.getAllByText("Écart de rémunération").length,
		).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("Écart de rémunération variable ou complémentaire")
				.length,
		).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText(
				/Proportion de femmes et d.*hommes dans chaque quartile/,
			).length,
		).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("Écart de rémunération par catégories de salariés")
				.length,
		).toBeGreaterThanOrEqual(1);
	});

	it("does not render Modifier buttons", () => {
		render(<Step6Review />);
		expect(screen.queryAllByText("Modifier")).toHaveLength(0);
	});

	it("does not render check icons on cards", () => {
		const { container } = render(<Step6Review />);
		const checkIcons = container.querySelectorAll(".fr-icon-check-line");
		expect(checkIcons).toHaveLength(0);
	});

	it("renders tooltip buttons on cards 3 and 4 only", () => {
		const { container } = render(<Step6Review />);
		const tooltipButtons = container.querySelectorAll(".fr-icon-question-line");
		expect(tooltipButtons).toHaveLength(2);
	});

	it("shows side-by-side Annuelle/Horaire brute with gaps for step 2", () => {
		render(
			<Step6Review
				step2Rows={[
					{
						label: "Annuelle brute moyenne",
						womenValue: "95",
						menValue: "100",
					},
					{
						label: "Horaire brute moyenne",
						womenValue: "90",
						menValue: "100",
					},
					{
						label: "Annuelle brute médiane",
						womenValue: "97",
						menValue: "100",
					},
					{
						label: "Horaire brute médiane",
						womenValue: "80",
						menValue: "100",
					},
				]}
			/>,
		);
		expect(screen.getAllByText("Annuelle brute").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText("Horaire brute").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText("Moyenne").length).toBeGreaterThanOrEqual(2);
		expect(screen.getAllByText("Médiane").length).toBeGreaterThanOrEqual(2);
		expect(screen.getAllByText("5,0 %").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("3,0 %").length).toBeGreaterThanOrEqual(1);
		expect(screen.queryByText("faible")).not.toBeInTheDocument();
		expect(screen.getAllByText("élevé").length).toBeGreaterThanOrEqual(1);
	});

	it("shows 'Aucune donnée renseignée' for empty steps", () => {
		render(<Step6Review />);
		const emptyMessages = screen.getAllByText("Aucune donnée renseignée.");
		expect(emptyMessages.length).toBe(4);
	});

	it("renders step 3 with side-by-side gaps and proportion", () => {
		render(
			<Step6Review
				step3Data={{
					rows: [
						{
							label: "Annuelle brute moyenne",
							womenValue: "95",
							menValue: "100",
						},
						{
							label: "Annuelle brute médiane",
							womenValue: "",
							menValue: "",
						},
					],
					beneficiaryWomen: "45",
					beneficiaryMen: "55",
				}}
			/>,
		);
		expect(screen.getByText("45 %")).toBeInTheDocument();
		expect(screen.getByText("55 %")).toBeInTheDocument();
		expect(screen.getByText("Proportion")).toBeInTheDocument();
	});

	it("renders quartile data stacked annual then hourly", () => {
		render(
			<Step6Review
				step4Categories={[
					{
						name: "annual:1er quartile",
						womenCount: 46,
						menCount: 54,
					},
					{
						name: "annual:2e quartile",
						womenCount: 47,
						menCount: 53,
					},
					{
						name: "hourly:1er quartile",
						womenCount: 40,
						menCount: 60,
					},
					{
						name: "hourly:2e quartile",
						womenCount: 50,
						menCount: 50,
					},
				]}
			/>,
		);
		expect(
			screen.getByText("Rémunération annuelle brute moyenne"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Rémunération horaire brute moyenne"),
		).toBeInTheDocument();
		expect(screen.getAllByText("1er quartile").length).toBe(4);
		expect(screen.getAllByText("Pourcentage de femmes").length).toBe(2);
		expect(screen.getAllByText(/Pourcentage d.*hommes/).length).toBe(2);
	});

	it("renders step 5 category gaps side-by-side", () => {
		render(
			<Step6Review
				step5Categories={[
					makeCategory({
						name: "Ingénieurs",
						detail: "Dev",
						womenCount: 10,
						menCount: 15,
						annualBaseWomen: "3000",
						annualBaseMen: "3200",
						annualVariableWomen: "500",
						annualVariableMen: "600",
						hourlyBaseWomen: "18",
						hourlyBaseMen: "19",
						hourlyVariableWomen: "3",
						hourlyVariableMen: "4",
					}),
				]}
			/>,
		);
		expect(screen.getByText("Ingénieurs")).toBeInTheDocument();
		expect(screen.getAllByText("Annuelle brute").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText("Horaire brute").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText("Salaire de base").length).toBe(2);
		expect(screen.getAllByText("Composantes variables").length).toBe(2);
		expect(screen.getAllByText("élevé").length).toBeGreaterThanOrEqual(1);
	});

	it("renders previous link pointing to step 5", () => {
		render(<Step6Review />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/5",
		);
	});

	it("renders next as a submit button when not submitted", () => {
		render(<Step6Review />);
		expect(
			screen.getByRole("button", { name: /suivant/i }),
		).toBeInTheDocument();
	});

	it("renders next link pointing to compliance path when already submitted", () => {
		render(<Step6Review isSubmitted />);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("renders previous link to home and next link to compliance path when already submitted", () => {
		render(<Step6Review isSubmitted />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/",
		);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("renders PDF download button when submitted", () => {
		render(<Step6Review isSubmitted />);
		expect(
			screen.getByRole("link", { name: /télécharger le récapitulatif/i }),
		).toHaveAttribute("href", "/api/declaration-pdf");
	});

	it("does not render PDF download button when not submitted", () => {
		render(<Step6Review />);
		expect(
			screen.queryByRole("link", { name: /télécharger le récapitulatif/i }),
		).not.toBeInTheDocument();
	});

	it("shows 'Prochaines étapes' callout when a gap >= 5%", () => {
		render(
			<Step6Review
				siren="532847196"
				step2Rows={[
					{
						label: "Annuelle brute moyenne",
						womenValue: "90",
						menValue: "100",
					},
					{
						label: "Horaire brute moyenne",
						womenValue: "100",
						menValue: "100",
					},
					{
						label: "Annuelle brute médiane",
						womenValue: "100",
						menValue: "100",
					},
					{
						label: "Horaire brute médiane",
						womenValue: "100",
						menValue: "100",
					},
				]}
			/>,
		);
		expect(screen.getByText("Prochaines étapes")).toBeInTheDocument();
		expect(screen.getByText("Des écarts ont été détectés")).toBeInTheDocument();
		expect(
			screen.getByText(/des écarts ≥ 5 % ont été identifiés/),
		).toBeInTheDocument();
		expect(screen.getByText("Pour vous aider")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /critères objectifs/ }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /actions correctives/ }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /évaluation conjointe/ }),
		).toBeInTheDocument();
	});

	it("renders 'Modèles d'avis CSE' link", () => {
		render(<Step6Review />);
		expect(
			screen.getByRole("link", { name: /Modèles d.*avis CSE/ }),
		).toHaveAttribute("href", "/avis-cse");
	});

	it("does not show 'Prochaines étapes' callout when all gaps < 5%", () => {
		render(
			<Step6Review
				step2Rows={[
					{
						label: "Annuelle brute moyenne",
						womenValue: "98",
						menValue: "100",
					},
					{
						label: "Horaire brute moyenne",
						womenValue: "99",
						menValue: "100",
					},
					{
						label: "Annuelle brute médiane",
						womenValue: "97",
						menValue: "100",
					},
					{
						label: "Horaire brute médiane",
						womenValue: "99",
						menValue: "100",
					},
				]}
			/>,
		);
		expect(screen.queryByText("Prochaines étapes")).not.toBeInTheDocument();
	});
});
