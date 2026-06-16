import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

	it("renders 'Télécharger' tertiary download button", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		const link = screen.getByRole("link", { name: "Télécharger" });
		expect(link).toHaveAttribute("href", "/api/declaration-pdf?year=2025");
		expect(link.className).toContain("fr-btn--tertiary");
	});

	it("renders download link with correction param when isCorrection", () => {
		render(<RecapitulatifPage {...defaultProps()} isCorrection />);
		const link = screen.getByRole("link", { name: "Télécharger" });
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
		// The bottom action is the full "Retour à Mon Espace" button — there is
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
		expect(
			screen.getByText("Effectif annuel moyen en 2025"),
		).toBeInTheDocument();
		// "250" appears both as company.workforce and as 120 + 130 total in the
		// workforce table — both are expected.
		expect(screen.getAllByText("250").length).toBeGreaterThanOrEqual(1);
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

	it("renders primary 'Retour à Mon Espace' button linking to mon-espace", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		const returnLink = screen.getByRole("link", {
			name: "Retour à Mon Espace",
		});
		expect(returnLink).toHaveAttribute("href", "/mon-espace");
		expect(returnLink.className).toContain("fr-btn--primary");
		expect(returnLink.className).not.toContain("fr-btn--secondary");
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

	it("falls back to the raw source key when it is not a known label", () => {
		render(
			<RecapitulatifPage {...defaultProps()} step5Source="source-inconnue" />,
		);
		expect(screen.getByText("source-inconnue")).toBeInTheDocument();
	});

	it("hides Effectif annuel moyen when company.workforce is null", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				company={{ ...defaultCompany(), workforce: null }}
			/>,
		);
		expect(
			screen.queryByText(/Effectif annuel moyen en/),
		).not.toBeInTheDocument();
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
