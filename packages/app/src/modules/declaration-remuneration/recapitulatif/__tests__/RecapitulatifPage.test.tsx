import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GIP_WORKFORCE_VOLUNTARY_DISPLAY } from "~/modules/domain";
import {
	DIVERGENT_HOURLY_MEDIAN,
	noPayGapReferences,
} from "~/test/gipGapFixtures";
import { RecapitulatifPage } from "../RecapitulatifPage";
import {
	defaultCompany,
	defaultProps,
	emptyStep2Data,
	emptyStep3Data,
	makeCategory,
} from "./fixtures";

describe("RecapitulatifPage", () => {
	it("renders h1 with year", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /Déclaration des indicateurs de rémunération 2025/,
			}),
		).toBeInTheDocument();
	});

	it("demotes the title to h3 when embedded via titleTag (no second h1)", () => {
		render(<RecapitulatifPage {...defaultProps()} titleTag="h3" />);
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: /Déclaration des indicateurs de rémunération 2025/,
			}),
		).toBeInTheDocument();
		expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
	});

	it("renders 'Télécharger' tertiary download button", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		const link = screen.getByRole("link", {
			name: "Télécharger la déclaration des indicateurs de rémunération (PDF)",
		});
		expect(link).toHaveAttribute("href", "/api/declaration-pdf?year=2025");
		expect(link.className).toContain("fr-btn--tertiary");
	});

	it("renders download link with correction param when isCorrection", () => {
		render(<RecapitulatifPage {...defaultProps()} isCorrection />);
		const link = screen.getByRole("link", {
			name: "Télécharger la déclaration des indicateurs de rémunération (PDF)",
		});
		expect(link).toHaveAttribute(
			"href",
			"/api/declaration-pdf?year=2025&type=correction",
		);
	});

	it("does not render its own breadcrumb or back link (handled by the page route at fr-container width)", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(
			screen.queryByRole("navigation", { name: /vous êtes ici/i }),
		).not.toBeInTheDocument();
		// The bottom action is the full "Mon espace" button — there is
		// no standalone top "Retour" breadcrumb link.
		expect(
			screen.queryByRole("link", { name: "Retour" }),
		).not.toBeInTheDocument();
	});

	it("renders declarant info with Nom Prénom and Adresse email", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(
			screen.getByRole("heading", { level: 2, name: "Informations déclarant" }),
		).toBeInTheDocument();
		expect(screen.getByText("Nom Prénom")).toBeInTheDocument();
		expect(screen.getByText("Marie Dupont")).toBeInTheDocument();
		expect(screen.getByText("Adresse email")).toBeInTheDocument();
		expect(screen.getByText("marie@acme.fr")).toBeInTheDocument();
	});

	it("renders company info with all fields including workforce", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Informations entreprise",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Raison sociale")).toBeInTheDocument();
		expect(screen.getByText("ACME Corp")).toBeInTheDocument();
		expect(screen.getByText("SIREN")).toBeInTheDocument();
		expect(screen.getByText("123456789")).toBeInTheDocument();
		expect(screen.getByText("Adresse")).toBeInTheDocument();
		expect(screen.getByText("1 rue de Paris, 75001 Paris")).toBeInTheDocument();
		expect(screen.getByText("Code NAF")).toBeInTheDocument();
		expect(screen.getByText("6201Z")).toBeInTheDocument();
		const workforceLabel = screen.getByText("Effectif annuel moyen en 2025");
		expect(workforceLabel).toBeInTheDocument();
		// "250" also appears as the 120 + 130 total of the workforce table, so the
		// company value is read from the row that carries the label.
		expect(workforceLabel.parentElement).toHaveTextContent(
			"Effectif annuel moyen en 2025250",
		);
	});

	it("renders 'Informations calcul' with single-line reference period", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(
			screen.getByRole("heading", { level: 2, name: "Informations calcul" }),
		).toBeInTheDocument();
		expect(screen.getByText("Période de référence")).toBeInTheDocument();
		expect(screen.getByText("01/01/2025 - 31/12/2025")).toBeInTheDocument();
	});

	it("renders informations sections without table markup", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		// Real <table>s are reserved for the workforce + indicator data.
		// The 3 "Informations …" sections must use <dl>, not <table>.
		const tables = screen.getAllByRole("table");
		for (const t of tables) {
			const caption = t.querySelector("caption")?.textContent ?? "";
			expect(caption).not.toMatch(/^Informations /);
		}
	});

	it("renders the workforce table under the indicator section", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		// Section heading is h2; the workforce sub-heading is h3.
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /Indicateurs pour l.*ensemble de vos salariés/,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: /Effectifs physiques pris en compte/,
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Nombre de salariés")).toBeInTheDocument();
		// Workforce: 120 women + 130 men = 250 total. The same "250" also
		// appears in the company info row, hence getAllByText.
		expect(screen.getAllByText("250").length).toBeGreaterThanOrEqual(1);
	});

	it("renders all indicator section sub-headings", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(
			screen.getByRole("heading", { level: 3, name: "Écart de rémunération" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: "Écart de rémunération variable ou complémentaire",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: /Proportion de femmes et d.*hommes dans chaque quartile/,
			}),
		).toBeInTheDocument();
	});

	it("renders empty notices for empty indicator/category sections", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		// 2 gap tables (Écart + Variable) + 0 categories = 3 empty notices.
		const emptyMessages = screen.getAllByText("Aucune donnée renseignée.");
		expect(emptyMessages.length).toBeGreaterThanOrEqual(3);
	});

	it("renders pay-gap rows when step2 data is provided", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				step2Data={{
					indicatorAAnnualWomen: "35050.21",
					indicatorAAnnualMen: "36739.82",
					indicatorAHourlyWomen: "13.21",
					indicatorAHourlyMen: "14.23",
					indicatorCAnnualWomen: "34110.90",
					indicatorCAnnualMen: "35739.82",
					indicatorCHourlyWomen: "12.21",
					indicatorCHourlyMen: "13.23",
				}}
			/>,
		);
		expect(screen.getByText("Annuelle brute moyenne")).toBeInTheDocument();
		expect(screen.getByText("Annuelle brute médiane")).toBeInTheDocument();
		expect(
			screen.getAllByText("Horaire brute moyenne").length,
		).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("Horaire brute médiane").length,
		).toBeGreaterThanOrEqual(1);
	});

	// The recap is a read-only surface: it must print the gap that was recorded
	// and published, not a fresh recomputation that can drift from it.
	it("shows the recorded GIP gap rather than recomputing it from the operands", () => {
		const { women, men, gap } = DIVERGENT_HOURLY_MEDIAN;
		const gaps = noPayGapReferences();
		gaps[3] = { women, men, gap };

		render(
			<RecapitulatifPage
				{...defaultProps()}
				step3Data={{
					...emptyStep3Data(),
					indicatorDHourlyWomen: women,
					indicatorDHourlyMen: men,
				}}
				step3Gaps={gaps}
			/>,
		);

		expect(screen.getByText("7,19 %")).toBeInTheDocument();
		expect(screen.queryByText("0,00 %")).not.toBeInTheDocument();
	});

	it("recomputes the recap gap once an operand no longer matches the GIP one", () => {
		const { women, men, gap } = DIVERGENT_HOURLY_MEDIAN;
		const gaps = noPayGapReferences();
		gaps[3] = { women, men, gap };

		render(
			<RecapitulatifPage
				{...defaultProps()}
				step3Data={{
					...emptyStep3Data(),
					indicatorDHourlyWomen: women,
					indicatorDHourlyMen: "0.12",
				}}
				step3Gaps={gaps}
			/>,
		);

		expect(screen.getByText("16,66 %")).toBeInTheDocument();
		expect(screen.queryByText("7,19 %")).not.toBeInTheDocument();
	});

	it("renders proportion table when step3 indicatorE values are present", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				step3Data={{
					...emptyStep3Data(),
					indicatorEWomen: "60",
					indicatorEMen: "70",
				}}
			/>,
		);
		expect(screen.getByText(/Total de salariés : 250/)).toBeInTheDocument();
		// The "Bénéficiaires de composantes / variables ou complémentaires"
		// header wraps via `<br />` so its textContent spans multiple nodes.
		// Match it via the column header role.
		const beneficiairesHeader = screen
			.getAllByRole("columnheader")
			.find((cell) =>
				cell.textContent?.includes(
					"Bénéficiaires de composantesvariables ou complémentaires",
				),
			);
		expect(beneficiairesHeader).toBeDefined();
	});

	it("renders quartile tables when step4 data is provided", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				step4Data={{
					annual: [
						{ threshold: "20700.35", women: 30, men: 60 },
						{ threshold: "25750.99", women: 40, men: 30 },
						{ threshold: "34900.99", women: 24, men: 31 },
						{ threshold: "", women: 15, men: 26 },
					],
					hourly: [
						{ threshold: "10", women: 30, men: 60 },
						{ threshold: "15", women: 40, men: 30 },
						{ threshold: "20", women: 24, men: 31 },
						{ threshold: "", women: 15, men: 26 },
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
		expect(screen.getAllByText("1er quartile").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(
			screen.getAllByText("Tous les salariés").length,
		).toBeGreaterThanOrEqual(1);
	});

	it("locks the computed quartile percentages and grand totals (iso-behaviour)", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				step4Data={{
					annual: [
						{ threshold: "20700.35", women: 30, men: 60 },
						{ threshold: "25750.99", women: 40, men: 30 },
						{ threshold: "34900.99", women: 24, men: 31 },
						{ threshold: "", women: 15, men: 26 },
					],
					hourly: [
						{ threshold: "10", women: 30, men: 60 },
						{ threshold: "15", women: 40, men: 30 },
						{ threshold: "20", women: 24, men: 31 },
						{ threshold: "", women: 15, men: 26 },
					],
				}}
			/>,
		);
		for (const pct of [
			"33,3 %",
			"66,7 %",
			"57,1 %",
			"42,9 %",
			"43,6 %",
			"56,4 %",
			"36,6 %",
			"63,4 %",
			"42,6 %",
			"57,4 %",
		]) {
			expect(screen.getAllByText(pct)).toHaveLength(2);
		}
		expect(screen.getAllByText("109")).toHaveLength(2);
		expect(screen.getAllByText("147")).toHaveLength(2);
	});

	it("renders one category table per step5 category with matching heading", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				step5Categories={[
					makeCategory({
						name: "Ouvriers / Employés",
						womenCount: 53,
						menCount: 25,
					}),
					makeCategory({ name: "Techniciens", womenCount: 10, menCount: 15 }),
				]}
			/>,
		);
		expect(
			screen.getByText("Catégorie d'emplois n°1 : Ouvriers / Employés"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Catégorie d'emplois n°2 : Techniciens"),
		).toBeInTheDocument();
		expect(screen.getAllByText("Effectif physique").length).toBe(2);
		// "Total salariés : 78" total label must appear for the first category row.
		expect(screen.getByText("Total salariés : 78")).toBeInTheDocument();
	});

	it("renders source line when step5Source is provided", () => {
		render(
			<RecapitulatifPage {...defaultProps()} step5Source="accord-entreprise" />,
		);
		expect(
			screen.getByText(
				/Source utilisée pour déterminer les catégories d.*emplois/,
			),
		).toBeInTheDocument();
		expect(screen.getByText("Accord d'entreprise")).toBeInTheDocument();
	});

	// The Figma reference shows a single secondary "Mon espace" instance, so the
	// bottom action must not vary with isCorrection.
	it.each([
		false,
		true,
	])("renders the same secondary 'Mon espace' bottom action (isCorrection: %s)", (isCorrection) => {
		render(
			<RecapitulatifPage {...defaultProps()} isCorrection={isCorrection} />,
		);
		const returnLink = screen.getByRole("link", { name: "Mon espace" });
		expect(returnLink).toHaveAttribute("href", "/mon-espace");
		expect(returnLink.className).toContain("fr-btn--secondary");
		expect(returnLink.className).not.toContain("fr-btn--primary");
		expect(
			screen.queryByRole("link", { name: "Retour à Mon Espace" }),
		).not.toBeInTheDocument();
	});

	it("does not render its own ResourceBanner (PublicChrome handles it)", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(screen.queryByTestId("resource-banner")).not.toBeInTheDocument();
	});

	it("hides NAF code when not available", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				company={{ ...defaultCompany(), nafCode: null }}
			/>,
		);
		expect(screen.queryByText("Code NAF")).not.toBeInTheDocument();
	});

	it("hides address when not available", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				company={{ ...defaultCompany(), address: null }}
			/>,
		);
		expect(screen.queryByText("Adresse")).not.toBeInTheDocument();
	});

	it("omits the Nom Prénom row when declarantName is empty", () => {
		render(<RecapitulatifPage {...defaultProps()} declarantName="" />);
		expect(
			screen.getByRole("heading", { level: 2, name: "Informations déclarant" }),
		).toBeInTheDocument();
		expect(screen.queryByText("Nom Prénom")).not.toBeInTheDocument();
		expect(screen.getByText("marie@acme.fr")).toBeInTheDocument();
	});

	it("humanises the source key when it is not a known label", () => {
		render(
			<RecapitulatifPage {...defaultProps()} step5Source="source-inconnue" />,
		);
		expect(screen.getByText("Source inconnue")).toBeInTheDocument();
		expect(screen.queryByText("source-inconnue")).not.toBeInTheDocument();
	});

	// Regression #4014: legacy values must render identically here and in the PDF.
	it("labels a legacy source value saved before the step 5 options changed", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				step5Source="convention-collective"
			/>,
		);
		expect(screen.getByText("Convention collective")).toBeInTheDocument();
	});

	it("shows '< 50' when company.gipWorkforce is null", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				company={{ ...defaultCompany(), gipWorkforce: null }}
			/>,
		);
		expect(
			screen.getByText("Effectif annuel moyen en 2025"),
		).toBeInTheDocument();
		expect(screen.getByText(GIP_WORKFORCE_VOLUNTARY_DISPLAY)).toBeInTheDocument();
	});

	it("shows '< 50' instead of the exact headcount when the company is in the GIP file below the threshold", () => {
		// Issue 3914: the bracket was keyed on "absent from the GIP file", so a
		// company present with 37 employees rendered "37".
		render(
			<RecapitulatifPage
				{...defaultProps()}
				company={{ ...defaultCompany(), gipWorkforce: 37 }}
			/>,
		);
		expect(screen.getByText(GIP_WORKFORCE_VOLUNTARY_DISPLAY)).toBeInTheDocument();
		expect(screen.queryByText("37")).not.toBeInTheDocument();
	});

	it("floors a decimal company.gipWorkforce for display", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				company={{ ...defaultCompany(), gipWorkforce: 99.97 }}
			/>,
		);
		expect(
			screen.getByText("Effectif annuel moyen en 2025"),
		).toBeInTheDocument();
		expect(screen.getByText("99")).toBeInTheDocument();
	});

	it("flags 'élevé' badge on high gaps (>= 5%)", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				step2Data={{
					...emptyStep2Data(),
					// 7,17 % gap → high
					indicatorAHourlyWomen: "13.21",
					indicatorAHourlyMen: "14.23",
				}}
			/>,
		);
		const badges = screen.getAllByText("élevé");
		expect(badges.length).toBeGreaterThanOrEqual(1);
	});
});
