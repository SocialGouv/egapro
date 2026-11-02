import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CseOpinionRecapData } from "../buildCseOpinionRecapData";

const mocks = vi.hoisted(() => ({
	ensurePdfFontsRegistered: vi.fn(),
}));

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	return {
		Document: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", { "data-testid": "pdf-document" }, children),
		Page: ({ children, size }: { children: React.ReactNode; size: string }) =>
			React.createElement(
				"section",
				{ "data-size": size, "data-testid": "pdf-page" },
				children,
			),
		Text: ({ children }: { children: React.ReactNode }) =>
			React.createElement("span", null, children),
		View: ({ children, wrap }: { children: React.ReactNode; wrap?: boolean }) =>
			React.createElement(
				"div",
				{ "data-unbreakable": wrap === false ? "true" : undefined },
				children,
			),
		Image: ({ src }: { src: string }) =>
			React.createElement("div", {
				"data-testid": "pdf-image",
				"data-src": src,
			}),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

vi.mock("../pdfFonts", () => ({
	PDF_FONT_FAMILY: "Marianne",
	ensurePdfFontsRegistered: mocks.ensurePdfFontsRegistered,
}));

import { CseOpinionPdfDocument } from "../CseOpinionPdfDocument";

const DATA: CseOpinionRecapData = {
	year: 2027,
	transmittedAt: "10/12/2027",
	company: { name: "Société Démo", siren: "123 456 789" },
	declarantRows: [
		{ label: "Nom Prénom", value: "Marie Dupont" },
		{ label: "Numéro de téléphone", value: "06 01 02 03 04" },
	],
	companyRows: [
		{ label: "Raison sociale", value: "Société Démo" },
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
			],
		},
		{
			declarationNumber: 2,
			title: "Seconde déclaration",
			opinions: [
				{
					id: "2:gap",
					title: "Justification des écarts",
					rows: [{ label: "CSE informé et consulté", value: "Non" }],
				},
			],
		},
	],
	fileColumns: [
		{
			id: "1:accuracy",
			label: "Exactitude",
			declarationLabel: "1re déclaration",
		},
		{ id: "2:gap", label: "Justification", declarationLabel: "2e déclaration" },
	],
	files: [
		{
			id: "file-1",
			name: "avis-exactitude.pdf",
			detail: "PDF – 17,96 Ko · déposé le 17 août 2026",
			columnIds: ["1:accuracy"],
		},
	],
};

function renderDocument(data: CseOpinionRecapData = DATA) {
	return render(<CseOpinionPdfDocument data={data} />);
}

describe("CseOpinionPdfDocument", () => {
	beforeEach(() => {
		mocks.ensurePdfFontsRegistered.mockClear();
	});

	it("titles the recap and dates its transmission with the maquette wording", () => {
		renderDocument();

		expect(
			screen.getByText(
				"Récapitulatif : Transmission du ou des avis du CSE 2027",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Les éléments ont été transmis le 10/12/2027."),
		).toBeInTheDocument();
		expect(mocks.ensurePdfFontsRegistered).toHaveBeenCalledTimes(1);
	});

	it("lays out the sections in maquette order", () => {
		const { container } = renderDocument();
		const text = container.textContent ?? "";
		const start = text.indexOf("Les éléments ont été transmis");
		const order = [
			"Informations",
			"Déclarant",
			"Entreprise",
			"Calcul",
			"Avis CSE",
			"Première déclaration",
			"Seconde déclaration",
			"Fichier(s) déposé(s)",
		].map((heading) => text.indexOf(heading, start));

		expect(order.every((index) => index >= 0)).toBe(true);
		expect([...order].sort((a, b) => a - b)).toEqual(order);
	});

	it("renders every information and opinion row it is given", () => {
		renderDocument();

		for (const value of [
			"Marie Dupont",
			"06 01 02 03 04",
			"Existence d'un CSE",
			"01/01/2026 - 31/12/2026",
			"Exactitude des données",
			"Favorable",
			"07/08/2026",
			"CSE informé et consulté",
			"Non",
		]) {
			expect(screen.getByText(value)).toBeInTheDocument();
		}
	});

	it("keeps each opinion block on a single page", () => {
		renderDocument();

		const title = screen.getByText("Exactitude des données");
		expect(title.closest("[data-unbreakable]")).toHaveTextContent("07/08/2026");
	});

	it("marks each file against the columns it carries with a check or a dash", () => {
		renderDocument();

		expect(
			screen.getByText("Exactitude\n1re déclaration", { normalizer: (s) => s }),
		).toBeInTheDocument();
		const row = screen
			.getByText("avis-exactitude.pdf")
			.closest("[data-unbreakable]") as HTMLElement;
		expect(
			within(row).getByText("PDF – 17,96 Ko · déposé le 17 août 2026"),
		).toBeInTheDocument();
		const marks = within(row)
			.getAllByTestId("pdf-image")
			.map((mark) => mark.getAttribute("data-src"));
		expect(marks).toEqual([
			expect.stringMatching(/opinion-check\.png$/),
			expect.stringMatching(/opinion-dash\.png$/),
		]);
	});

	it("uses the bare type as column header without a second declaration", () => {
		renderDocument({
			...DATA,
			fileColumns: [
				{ id: "1:accuracy", label: "Exactitude", declarationLabel: null },
			],
		});

		expect(screen.getByText("Exactitude")).toBeInTheDocument();
	});

	it("repeats the year, the formatted siren and the transmission date in the footer", () => {
		renderDocument();

		expect(
			screen.getByText(
				"Transmission du ou des avis du CSE 2027 - SIREN 123 456 789 - transmise le 10/12/2027",
			),
		).toBeInTheDocument();
		expect(screen.getByTestId("pdf-page")).toHaveAttribute("data-size", "A4");
	});
});
