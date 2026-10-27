import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CseOpinionRecapData } from "~/modules/declarationPdf/buildCseOpinionRecapData";
import { SubmittedOpinionsPage } from "../SubmittedOpinionsPage";

const recap: CseOpinionRecapData = {
	year: 2027,
	transmittedAt: "10/02/2027",
	company: { name: "Société Démo", siren: "123 456 789" },
	declarantRows: [
		{ label: "Nom Prénom", value: "Marie Dupont" },
		{ label: "Adresse email", value: "email@example.fr" },
		{ label: "Numéro de téléphone", value: "01 02 03 04 05" },
	],
	companyRows: [
		{ label: "Raison sociale", value: "Société Démo" },
		{ label: "SIREN", value: "123 456 789" },
		{ label: "Code NAF", value: "62.02A - Conseil en systèmes" },
		{ label: "Effectif annuel moyen en 2026", value: "150" },
		{ label: "Existence d'un CSE", value: "Oui" },
	],
	referencePeriods: [
		{ label: "Période de référence", value: "01/01/2026 - 31/12/2026" },
	],
	declarations: [
		{
			declarationNumber: 1,
			title: "Première déclaration",
			opinions: [
				{
					id: "1:accuracy",
					title: "Exactitude des données",
					rows: [
						{ label: "Avis du CSE", value: "Favorable" },
						{ label: "Date de l'avis rendu par le CSE", value: "07/08/2026" },
					],
				},
				{
					id: "1:gap",
					title: "Justification des écarts",
					rows: [{ label: "CSE informé et consulté", value: "Non" }],
				},
			],
		},
	],
	fileColumns: [
		{ id: "1:accuracy", label: "Exactitude", declarationLabel: null },
		{ id: "1:gap", label: "Justification", declarationLabel: null },
	],
	files: [
		{
			id: "file-1",
			name: "avis-exactitude-cse.pdf",
			detail: "PDF – 17,96 Ko · déposé le 17 août 2026",
			columnIds: ["1:accuracy"],
		},
		{
			id: "file-2",
			name: "avis-justification-cse.pdf",
			detail: "PDF · déposé le 18 août 2026",
			columnIds: ["1:gap"],
		},
	],
};

function renderPage(
	overrides: Partial<CseOpinionRecapData> = {},
	hasSubmittedJointEvaluation = true,
) {
	return render(
		<SubmittedOpinionsPage
			{...recap}
			{...overrides}
			hasSubmittedJointEvaluation={hasSubmittedJointEvaluation}
		/>,
	);
}

describe("SubmittedOpinionsPage", () => {
	it("titles the page with the year and the transmission date", () => {
		renderPage();

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Transmission du ou des avis du CSE 2027",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText("La déclaration a été transmise le 10/02/2027."),
		).toBeInTheDocument();
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("leads back to the company's démarche through the breadcrumb", () => {
		renderPage();

		const breadcrumb = screen.getByRole("navigation", {
			name: /vous êtes ici/i,
		});
		expect(
			within(breadcrumb).getByRole("link", { name: "Société Démo" }),
		).toHaveAttribute("href", "/mon-espace");
		expect(
			within(breadcrumb).getByText(
				"Démarche des indicateurs de rémunération 2027",
			),
		).toBeInTheDocument();
	});

	it("always offers the transmission recap PDF", () => {
		renderPage();

		expect(
			screen.getByRole("link", {
				name: "Télécharger le récapitulatif de la transmission du ou des avis du CSE (PDF)",
			}),
		).toHaveAttribute("href", "/api/cse-opinion-pdf?year=2027");
	});

	it("lists the declarant, company and calculation rows it is given", () => {
		renderPage();

		for (const row of [
			...recap.declarantRows,
			...recap.companyRows,
			...recap.referencePeriods,
		]) {
			const term = screen.getAllByText(row.label)[0];
			expect(term?.closest("div")).toHaveTextContent(row.value);
		}
	});

	it("groups each opinion under its declaration", () => {
		renderPage();

		expect(
			screen.getByRole("heading", { level: 3, name: "Première déclaration" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 4, name: "Exactitude des données" }),
		).toBeInTheDocument();
		expect(screen.getByText("CSE informé et consulté")).toBeInTheDocument();
		expect(screen.getAllByText("Avis du CSE")).toHaveLength(1);
	});

	it("marks each file against the opinions it carries", () => {
		renderPage();

		const table = screen.getByRole("table");
		expect(
			within(table).getByRole("columnheader", { name: "Exactitude" }),
		).toBeInTheDocument();
		expect(
			within(table).queryByRole("columnheader", { name: "Téléchargement" }),
		).not.toBeInTheDocument();

		const firstRow = screen.getByRole("row", {
			name: /avis-exactitude-cse\.pdf/,
		});
		const cells = within(firstRow).getAllByRole("cell");
		expect(cells[0]).toHaveTextContent("Avis associé");
		expect(cells[1]).toHaveTextContent("Non associé");
	});

	it("opens each file in a new tab with its full name and meta line", () => {
		renderPage();

		const link = screen.getByRole("link", {
			name: /^avis-exactitude-cse\.pdf\s*\(ouvre une nouvelle fenêtre\)$/,
		});
		expect(link).toHaveAttribute("href", "/api/v1/files/file-1");
		expect(link).toHaveAttribute("target", "_blank");
		expect(
			screen.getByText("PDF – 17,96 Ko · déposé le 17 août 2026"),
		).toBeInTheDocument();
	});

	it("shows the declaration number in column headers when there is a second declaration", () => {
		renderPage({
			fileColumns: [
				{
					id: "1:accuracy",
					label: "Exactitude",
					declarationLabel: "1re déclaration",
				},
				{
					id: "2:accuracy",
					label: "Exactitude",
					declarationLabel: "2e déclaration",
				},
			],
		});

		expect(
			screen.getByRole("columnheader", { name: "Exactitude 2e déclaration" }),
		).toBeInTheDocument();
	});

	it("links the joint evaluation report only when one was transmitted", () => {
		const { unmount } = renderPage();
		expect(
			screen.getByRole("link", {
				name: "Consulter le rapport de l’évaluation conjointe",
			}),
		).toHaveAttribute("href", "/mon-espace/evaluation-conjointe");
		unmount();

		renderPage({}, false);
		expect(
			screen.queryByRole("link", {
				name: "Consulter le rapport de l’évaluation conjointe",
			}),
		).not.toBeInTheDocument();
	});
});
