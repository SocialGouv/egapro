import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { RecapitulatifPage } from "../RecapitulatifPage";

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

const defaultCompany = () => ({
	name: "ACME Corp",
	siren: "123456789",
	nafCode: "6201Z",
	address: "1 rue de Paris, 75001 Paris",
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

const defaultProps = () => ({
	company: defaultCompany(),
	declarationYear: 2025,
	declarantEmail: "jean@acme.fr",
	isCorrection: false,
	totalWomen: 120,
	totalMen: 130,
	step2Data: emptyStep2Data(),
	step3Data: emptyStep3Data(),
	step4Data: emptyStep4Data(),
	step5Categories: [] as EmployeeCategoryRow[],
});

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

	it("renders download button with tertiary style", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(link).toHaveAttribute("href", "/api/declaration-pdf?year=2025");
		expect(link.className).toContain("fr-btn--tertiary");
	});

	it("renders download button with correction param when isCorrection", () => {
		render(<RecapitulatifPage {...defaultProps()} isCorrection />);
		const link = screen.getByRole("link", {
			name: /Télécharger le récapitulatif/,
		});
		expect(link).toHaveAttribute(
			"href",
			"/api/declaration-pdf?year=2025&type=correction",
		);
	});

	it("renders declarant info section", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(
			screen.getByRole("heading", { level: 2, name: "Informations déclarant" }),
		).toBeInTheDocument();
		expect(screen.getByText("Mail déclarant")).toBeInTheDocument();
		expect(screen.getByText("jean@acme.fr")).toBeInTheDocument();
	});

	it("renders company info section", () => {
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
		expect(screen.getByText("Code NAF")).toBeInTheDocument();
		expect(screen.getByText("6201Z")).toBeInTheDocument();
		expect(screen.getByText("Adresse")).toBeInTheDocument();
		expect(screen.getByText("1 rue de Paris, 75001 Paris")).toBeInTheDocument();
	});

	it("renders reference period section", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Informations période de référence",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Date de début")).toBeInTheDocument();
		expect(screen.getByText("01/01/2025")).toBeInTheDocument();
		expect(screen.getByText("Date de fin")).toBeInTheDocument();
		expect(screen.getByText("31/12/2025")).toBeInTheDocument();
	});

	it("renders workforce card with totals", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		const tables = screen.getAllByRole("table");
		const workforceTable = tables.find((t) =>
			t.querySelector("caption")?.textContent?.includes("Effectif"),
		);
		expect(workforceTable).toBeDefined();
		expect(screen.getByText("120")).toBeInTheDocument();
		expect(screen.getByText("130")).toBeInTheDocument();
		expect(screen.getByText("250")).toBeInTheDocument();
	});

	it("renders indicator section headings", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(
			screen.getByText("Indicateurs pour l'ensemble de vos salariés"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Indicateurs par catégorie de salariés"),
		).toBeInTheDocument();
	});

	it("renders all card titles", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
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

	it("shows empty messages when no data", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		const emptyMessages = screen.getAllByText("Aucune donnée renseignée.");
		expect(emptyMessages.length).toBe(4);
	});

	it("renders step 2 gap data when provided", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
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
			/>,
		);
		expect(screen.getAllByText("Annuelle brute").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText("Horaire brute").length).toBeGreaterThanOrEqual(
			1,
		);
	});

	it("renders step 3 proportion data", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
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
			/>,
		);
		expect(screen.getByText("45 %")).toBeInTheDocument();
		expect(screen.getByText("55 %")).toBeInTheDocument();
		expect(screen.getByText("Proportion")).toBeInTheDocument();
	});

	it("renders quartile data", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
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
	});

	it("renders step 5 category data", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				step5Categories={[
					makeCategory({
						name: "Ingénieurs",
						annualBaseWomen: "3000",
						annualBaseMen: "3200",
						hourlyBaseWomen: "18",
						hourlyBaseMen: "19",
					}),
				]}
			/>,
		);
		expect(screen.getByText("Ingénieurs")).toBeInTheDocument();
		expect(screen.getAllByText("Salaire de base").length).toBe(2);
	});

	it("renders return button linking to mon-espace", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		const returnLink = screen.getByRole("link", {
			name: /Retour à Mon Espace/,
		});
		expect(returnLink).toHaveAttribute("href", "/mon-espace");
	});

	it("renders top back link", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		const backLink = screen.getByRole("link", { name: "Retour" });
		expect(backLink).toHaveAttribute("href", "/mon-espace");
	});

	it("does not render its own ResourceBanner (PublicChrome handles it)", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		expect(screen.queryByTestId("resource-banner")).not.toBeInTheDocument();
	});

	it("renders informations sections without table markup", () => {
		render(<RecapitulatifPage {...defaultProps()} />);
		// Only the workforce + indicator tables are real <table>s.
		// The 3 "Informations …" sections must use <dl>, not <table>.
		const tables = screen.getAllByRole("table");
		for (const t of tables) {
			const caption = t.querySelector("caption")?.textContent ?? "";
			expect(caption).not.toMatch(/^Informations /);
		}
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
});
