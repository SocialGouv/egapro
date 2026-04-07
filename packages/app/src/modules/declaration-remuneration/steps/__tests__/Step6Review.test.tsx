import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { Step6Review } from "../Step6Review";

vi.mock("~/modules/declarationPdf", () => ({
	DownloadDeclarationPdfButton: ({ year }: { year?: number }) => (
		<a
			href={year ? `/api/declaration-pdf?year=${year}` : "/api/declaration-pdf"}
		>
			Télécharger le récapitulatif (PDF)
		</a>
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

const emptyDeclaration = () => ({
	siren: "",
	totalWomen: null,
	totalMen: null,
	status: null,
});

const emptyStep2Data = () => ({
	indicatorAAnnualWomen: "",
	indicatorAAnnualMen: "",
	indicatorAHourlyWomen: "",
	indicatorAHourlyMen: "",
	indicatorCAnnualWomen: "",
	indicatorCAnnualMen: "",
	indicatorCHourlyWomen: "",
	indicatorCHourlyMen: "",
});

const emptyStep3Data = () => ({
	indicatorBAnnualWomen: "",
	indicatorBAnnualMen: "",
	indicatorBHourlyWomen: "",
	indicatorBHourlyMen: "",
	indicatorDAnnualWomen: "",
	indicatorDAnnualMen: "",
	indicatorDHourlyWomen: "",
	indicatorDHourlyMen: "",
	indicatorEWomen: "",
	indicatorEMen: "",
});

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

describe("Step6Review", () => {
	it("renders title and stepper at step 6", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByText("Étape 6 sur 6")).toBeInTheDocument();
		expect(
			screen.getByText(/Déclaration des indicateurs de rémunération/),
		).toBeInTheDocument();
	});

	it("renders description text", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getByText(/Vérifiez que toutes les informations/),
		).toBeInTheDocument();
	});

	it("renders section headings", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getByText("Indicateurs pour l'ensemble de vos salariés"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Indicateurs par catégorie de salariés"),
		).toBeInTheDocument();
	});

	it("renders SavedIndicator", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("renders all 4 recap card titles", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
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
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.queryAllByText("Modifier")).toHaveLength(0);
	});

	it("does not render check icons on cards", () => {
		const { container } = render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		const checkIcons = container.querySelectorAll(".fr-icon-check-line");
		expect(checkIcons).toHaveLength(0);
	});

	it("renders tooltip buttons on cards 3 and 4 only", () => {
		const { container } = render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		const tooltipButtons = container.querySelectorAll(".fr-icon-question-line");
		expect(tooltipButtons).toHaveLength(2);
	});

	it("shows side-by-side Annuelle/Horaire brute with gaps for step 2", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={{
					indicatorAAnnualWomen: "95",
					indicatorAAnnualMen: "100",
					indicatorAHourlyWomen: "90",
					indicatorAHourlyMen: "100",
					indicatorCAnnualWomen: "97",
					indicatorCAnnualMen: "100",
					indicatorCHourlyWomen: "80",
					indicatorCHourlyMen: "100",
				}}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
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
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		const emptyMessages = screen.getAllByText("Aucune donnée renseignée.");
		expect(emptyMessages.length).toBe(4);
	});

	it("renders step 3 with side-by-side gaps and proportion", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={{
					indicatorBAnnualWomen: "95",
					indicatorBAnnualMen: "100",
					indicatorBHourlyWomen: "",
					indicatorBHourlyMen: "",
					indicatorDAnnualWomen: "",
					indicatorDAnnualMen: "",
					indicatorDHourlyWomen: "",
					indicatorDHourlyMen: "",
					indicatorEWomen: "45",
					indicatorEMen: "55",
				}}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByText("45 %")).toBeInTheDocument();
		expect(screen.getByText("55 %")).toBeInTheDocument();
		expect(screen.getByText("Proportion")).toBeInTheDocument();
	});

	it("renders quartile data stacked annual then hourly", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={{
					annual: [
						{ threshold: "1000", women: 46, men: 54 },
						{ threshold: "1500", women: 47, men: 53 },
						{ threshold: "2000" },
						{ threshold: "3000" },
					],
					hourly: [
						{ threshold: "10", women: 40, men: 60 },
						{ threshold: "15", women: 50, men: 50 },
						{ threshold: "20" },
						{ threshold: "30" },
					],
				}}
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
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
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
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/5",
		);
	});

	it("renders next as a submit button when not submitted", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /suivant/i }),
		).toBeInTheDocument();
	});

	it("renders next link pointing to compliance path when already submitted", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				isSubmitted
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("renders previous link to home and next link to compliance path when already submitted", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				isSubmitted
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
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
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				isSubmitted
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getByRole("link", { name: /télécharger le récapitulatif/i }),
		).toHaveAttribute("href", "/api/declaration-pdf?year=2025");
	});

	it("does not render PDF download button when not submitted", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(
			screen.queryByRole("link", { name: /télécharger le récapitulatif/i }),
		).not.toBeInTheDocument();
	});

	it("shows 'Prochaines étapes' callout when a gap >= 5%", () => {
		render(
			<Step6Review
				declaration={{
					siren: "532847196",
					totalWomen: null,
					totalMen: null,
					status: null,
				}}
				declarationYear={2025}
				step2Data={{
					indicatorAAnnualWomen: "90",
					indicatorAAnnualMen: "100",
					indicatorAHourlyWomen: "100",
					indicatorAHourlyMen: "100",
					indicatorCAnnualWomen: "100",
					indicatorCAnnualMen: "100",
					indicatorCHourlyWomen: "100",
					indicatorCHourlyMen: "100",
				}}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
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
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={emptyStep2Data()}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getByRole("link", { name: /Modèles d.*avis CSE/ }),
		).toHaveAttribute("href", "/avis-cse");
	});

	it("does not show 'Prochaines étapes' callout when all gaps < 5%", () => {
		render(
			<Step6Review
				declaration={emptyDeclaration()}
				declarationYear={2025}
				step2Data={{
					indicatorAAnnualWomen: "98",
					indicatorAAnnualMen: "100",
					indicatorAHourlyWomen: "99",
					indicatorAHourlyMen: "100",
					indicatorCAnnualWomen: "97",
					indicatorCAnnualMen: "100",
					indicatorCHourlyWomen: "99",
					indicatorCHourlyMen: "100",
				}}
				step3Data={emptyStep3Data()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.queryByText("Prochaines étapes")).not.toBeInTheDocument();
	});
});
