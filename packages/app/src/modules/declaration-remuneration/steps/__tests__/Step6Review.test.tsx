import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { noPayGapReferences } from "~/test/gipGapFixtures";
import { Step6Review } from "../Step6Review";

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
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({ annualBaseWomen: "90", annualBaseMen: "100" }),
				]}
			/>,
		);
		expect(screen.getByText("Étape 6 sur 6")).toBeInTheDocument();
		expect(
			screen.getByText(/Déclaration des indicateurs de rémunération/),
		).toBeInTheDocument();
	});

	it("names the read-only fieldset with a screen-reader-only legend (RGAA 11.6/11.7)", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({ annualBaseWomen: "90", annualBaseMen: "100" }),
				]}
			/>,
		);
		expect(
			screen.getByRole("group", { name: "Récapitulatif de la déclaration" }),
		).toBeInTheDocument();
	});

	it("renders description text", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
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
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(
			screen.getByText("Indicateurs pour l'ensemble de vos salariés"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Indicateurs par catégories de salariés"),
		).toBeInTheDocument();
	});

	it("renders SavedIndicator", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("renders all 4 recap card titles", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
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
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.queryAllByText("Modifier")).toHaveLength(0);
	});

	it("does not render check icons on cards", () => {
		const { container } = render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		const checkIcons = container.querySelectorAll(".fr-icon-check-line");
		expect(checkIcons).toHaveLength(0);
	});

	it("renders tooltip buttons on cards 3 and 4 only", () => {
		const { container } = render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		const tooltipButtons = container.querySelectorAll(".fr-btn--tooltip");
		expect(tooltipButtons).toHaveLength(2);
	});

	it("shows side-by-side Annuelle/Horaire brute with gaps for step 2", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
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
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({ annualBaseWomen: "90", annualBaseMen: "100" }),
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
		expect(screen.getAllByText("5,00 %").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("3,00 %").length).toBeGreaterThanOrEqual(1);
		expect(screen.queryByText("faible")).not.toBeInTheDocument();
		expect(screen.getAllByText("élevé").length).toBeGreaterThanOrEqual(1);
	});

	it("shows 'Aucune donnée renseignée' for empty steps", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		const emptyMessages = screen.getAllByText("Aucune donnée renseignée.");
		expect(emptyMessages.length).toBe(4);
	});

	it("renders step 3 with side-by-side gaps and proportion", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
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
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				totalMen={100}
				totalWomen={90}
			/>,
		);
		// Proportion = beneficiaries / workforce total, not the raw beneficiary count
		expect(screen.getByText("50,0 %")).toBeInTheDocument();
		expect(screen.getByText("55,0 %")).toBeInTheDocument();
		expect(screen.getByText("Proportion")).toBeInTheDocument();
	});

	it("renders quartile data stacked annual then hourly", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
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
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({
						name: "Ingénieurs",
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
		expect(
			screen.getAllByText("Composantes variables ou complémentaires").length,
		).toBe(2);
		expect(screen.getAllByText("élevé").length).toBeGreaterThanOrEqual(1);
	});

	it("renders previous link pointing to step 5", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/5",
		);
	});

	it("renders previous link pointing to step 4 when indicatorGRequired is false", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired={false}
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/4",
		);
	});

	it("renders next as a submit button when not submitted", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
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
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				isSubmitted
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("routes next link to /avis-cse when status is awaiting_cse_opinion", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={{
					...emptyDeclaration(),
					status: "awaiting_cse_opinion",
				}}
				declarationYear={2025}
				hasCse={true}
				indicatorGRequired
				isSubmitted
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/avis-cse",
		);
	});

	it("renders previous link to step 5 and next link to compliance path when already submitted", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				isSubmitted
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/5",
		);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("does not render PDF download button when submitted", () => {
		render(
			<Step6Review
				companyWorkforce={null}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
				isSubmitted
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(
			screen.queryByRole("link", { name: /télécharger le récapitulatif/i }),
		).not.toBeInTheDocument();
	});

	it("shows 'Prochaines étapes' callout when an indicator-G gap is at least 5%", () => {
		render(
			<Step6Review
				companyWorkforce={300}
				declaration={{
					siren: "532847196",
					status: null,
				}}
				declarationYear={2025}
				indicatorGRequired
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
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({ annualBaseWomen: "90", annualBaseMen: "100" }),
				]}
			/>,
		);
		expect(screen.getByText("Prochaines étapes")).toBeInTheDocument();
		expect(screen.getByText("Écarts détectés")).toBeInTheDocument();
		expect(screen.getByText("Actions à engager")).toBeInTheDocument();
		expect(
			screen.getByText(/des écarts ≥ 5 % ont été identifiés/),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/ont encore été identifiés/),
		).not.toBeInTheDocument();
		expect(screen.getByText(/vous pouvez :/)).toBeInTheDocument();
		expect(screen.queryByText(/vous devez :/)).not.toBeInTheDocument();
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

	it("does not show 'Prochaines étapes' for an A-F-only negative gap", () => {
		render(
			<Step6Review
				companyWorkforce={300}
				declaration={{ siren: "532847196", status: null }}
				declarationYear={2025}
				indicatorGRequired
				step2Data={{
					indicatorAAnnualWomen: "110",
					indicatorAAnnualMen: "100",
					indicatorAHourlyWomen: "100",
					indicatorAHourlyMen: "100",
					indicatorCAnnualWomen: "100",
					indicatorCAnnualMen: "100",
					indicatorCHourlyWomen: "100",
					indicatorCHourlyMen: "100",
				}}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
			/>,
		);
		expect(screen.queryByText("Prochaines étapes")).not.toBeInTheDocument();
	});

	it("shows 'Prochaines étapes' when an indicator-G gap is unfavourable to men", () => {
		render(
			<Step6Review
				companyWorkforce={300}
				declaration={{ siren: "532847196", status: null }}
				declarationYear={2025}
				indicatorGRequired
				step2Data={emptyStep2Data()}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({ annualBaseWomen: "110", annualBaseMen: "100" }),
				]}
			/>,
		);

		expect(screen.getByText("Prochaines étapes")).toBeInTheDocument();
	});

	it("does not show 'Prochaines étapes' callout when all gaps < 5%", () => {
		render(
			<Step6Review
				companyWorkforce={300}
				declaration={emptyDeclaration()}
				declarationYear={2025}
				indicatorGRequired
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
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({ annualBaseWomen: "98", annualBaseMen: "100" }),
				]}
			/>,
		);
		expect(screen.queryByText("Prochaines étapes")).not.toBeInTheDocument();
	});

	it("does not show 'Prochaines étapes' for an A-F-only gap when G is below the threshold", () => {
		render(
			<Step6Review
				companyWorkforce={300}
				declaration={{ siren: "532847196", status: null }}
				declarationYear={2025}
				indicatorGRequired
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
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({ annualBaseWomen: "98", annualBaseMen: "100" }),
				]}
			/>,
		);

		expect(screen.queryByText("Prochaines étapes")).not.toBeInTheDocument();
	});

	it("does not show 'Prochaines étapes' callout below 100 employees even with a high gap", () => {
		// Phase 2 is reserved to 100+ companies — a 50-99 firm never enters it.
		render(
			<Step6Review
				companyWorkforce={80}
				declaration={{ siren: "532847196", status: null }}
				declarationYear={2025}
				indicatorGRequired
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
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({ annualBaseWomen: "90", annualBaseMen: "100" }),
				]}
			/>,
		);
		expect(screen.queryByText("Prochaines étapes")).not.toBeInTheDocument();
	});

	it("does not show 'Prochaines étapes' callout when indicator G is not part of the declaration", () => {
		// Phase 2 requires indicator G — a 100+ firm that doesn't declare G stays out.
		render(
			<Step6Review
				companyWorkforce={300}
				declaration={{ siren: "532847196", status: null }}
				declarationYear={2025}
				indicatorGRequired={false}
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
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({ annualBaseWomen: "90", annualBaseMen: "100" }),
				]}
			/>,
		);
		expect(screen.queryByText("Prochaines étapes")).not.toBeInTheDocument();
	});

	it("keys the callout off the indicator-G gap, not the A-F gaps", () => {
		render(
			<Step6Review
				companyWorkforce={300}
				declaration={{ siren: "532847196", status: null }}
				declarationYear={2025}
				indicatorGRequired
				step2Data={{
					indicatorAAnnualWomen: "98",
					indicatorAAnnualMen: "100",
					indicatorAHourlyWomen: "100",
					indicatorAHourlyMen: "100",
					indicatorCAnnualWomen: "90",
					indicatorCAnnualMen: "100",
					indicatorCHourlyWomen: "100",
					indicatorCHourlyMen: "100",
				}}
				step2Gaps={noPayGapReferences()}
				step3Data={emptyStep3Data()}
				step3Gaps={noPayGapReferences()}
				step4Data={emptyStep4Data()}
				step5Categories={[
					makeCategory({ annualBaseWomen: "90", annualBaseMen: "100" }),
				]}
			/>,
		);
		expect(screen.getByText("Prochaines étapes")).toBeInTheDocument();
	});

	describe("CSE consultation section gating (issue #3945)", () => {
		// An indicator-G gap of 10% at 300 employees → the "Prochaines étapes"
		// callout renders; only the CSE consultation part is driven by hasCse.
		function renderWithHasCse(hasCse: boolean | null) {
			return render(
				<Step6Review
					companyWorkforce={300}
					declaration={{ siren: "532847196", status: null }}
					declarationYear={2025}
					hasCse={hasCse}
					indicatorGRequired
					step2Data={emptyStep2Data()}
					step2Gaps={noPayGapReferences()}
					step3Data={emptyStep3Data()}
					step3Gaps={noPayGapReferences()}
					step4Data={emptyStep4Data()}
					step5Categories={[
						makeCategory({ annualBaseWomen: "90", annualBaseMen: "100" }),
					]}
				/>,
			);
		}

		it.each([
			false,
			null,
		] as const)("hides the CSE consultation section but keeps gap actions and the CSE update button when hasCse is %s", (hasCse) => {
			renderWithHasCse(hasCse);

			expect(
				screen.queryByRole("heading", {
					name: "Informer et consulter le CSE",
				}),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/obligatoirement informer et consulter le CSE/),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/L'avis du CSE devra être transmis/),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/avis à transmettre lors de la dernière étape/),
			).not.toBeInTheDocument();

			expect(screen.getByText("Écarts détectés")).toBeInTheDocument();
			expect(
				screen.getByRole("heading", { name: "Actions à engager" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", {
					name: "Mettre à jour l'existence d'un CSE",
				}),
			).toBeInTheDocument();

			expect(
				screen.getByText(/À la suite de l'analyse de vos données/),
			).toBeInTheDocument();
			expect(
				screen.getByText(
					/vous devez informer et consulter le CSE sur cette justification/,
				),
			).toBeInTheDocument();
			expect(
				screen.getByText(/Soit mettre en place des actions correctives/),
			).toBeInTheDocument();
			expect(
				screen.getByText(
					"Soit réaliser une évaluation conjointe des rémunérations",
				),
			).toBeInTheDocument();
		});

		it("shows the CSE consultation section when hasCse is true", () => {
			renderWithHasCse(true);

			expect(
				screen.getByRole("heading", { name: "Informer et consulter le CSE" }),
			).toBeInTheDocument();
			expect(
				screen.getByText(/L'avis du CSE devra être transmis/),
			).toBeInTheDocument();
			expect(
				screen.getByText(/avis à transmettre lors de la dernière étape/),
			).toBeInTheDocument();

			expect(
				screen.getByText(/À la suite de l'analyse de vos données/),
			).toBeInTheDocument();
			expect(
				screen.getByText(
					/vous devez informer et consulter le CSE sur cette justification/,
				),
			).toBeInTheDocument();
			expect(
				screen.getByText(/Soit mettre en place des actions correctives/),
			).toBeInTheDocument();
			expect(
				screen.getByText(
					"Soit réaliser une évaluation conjointe des rémunérations",
				),
			).toBeInTheDocument();
		});
	});
});
