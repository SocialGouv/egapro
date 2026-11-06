import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RepresentationPdfData } from "../buildRepresentationPdfData";

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
		View: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children),
		Image: () => React.createElement("div", { "data-testid": "pdf-image" }),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

vi.mock("../pdfFonts", () => ({
	PDF_FONT_FAMILY: "Marianne",
	ensurePdfFontsRegistered: mocks.ensurePdfFontsRegistered,
}));

import { RepresentationPdfDocument } from "../RepresentationPdfDocument";

const DATA: RepresentationPdfData = {
	siren: "123456789",
	year: 2025,
	campaignYear: 2026,
	submittedAt: new Date("2026-03-10T08:00:00.000Z"),
	transmittedAt: "10/03/2026",
	referencePeriod: "01/01/2025 - 31/12/2025",
	declarantRows: [
		{ label: "Nom Prénom", value: "Marie Dupont" },
		{ label: "Adresse email", value: "marie.dupont@alphasolutions.com" },
		{ label: "Numéro de téléphone", value: "06 01 02 03 04" },
	],
	company: {
		name: "Alpha Solutions",
		siren: "123 456 789",
		location: {
			label: "Adresse",
			value: "12 rue des Innovateurs, 75011 Paris, France",
		},
		naf: "62.02A - Conseil en systèmes et logiciels informatiques",
		workforceLabel: "Effectif annuel moyen en 2025",
		workforceDisplay: "2 256",
	},
	indicators: [
		{
			title: "Cadres dirigeants",
			notComputableReason: null,
			womenPercent: 35,
			menPercent: 65,
			verdict: "compliant",
		},
		{
			title: "Membres des instances dirigeantes",
			notComputableReason: null,
			womenPercent: 25,
			menPercent: 75,
			verdict: "non_compliant",
		},
	],
	publicationApplicable: true,
	publishDate: "2026-12-31",
	hasWebsite: false,
	publishUrl: null,
	publishModalities: "Affichage dans les locaux.",
	generatedAt: new Date("2026-06-15T09:30:00.000Z"),
};

function renderDocument(overrides: Partial<RepresentationPdfData> = {}) {
	return render(<RepresentationPdfDocument data={{ ...DATA, ...overrides }} />);
}

describe("RepresentationPdfDocument", () => {
	beforeEach(() => {
		mocks.ensurePdfFontsRegistered.mockClear();
	});

	it("titles the recap and dates its transmission with the maquette wording, without a trailing period", () => {
		renderDocument();

		expect(
			screen.getByText(
				"Récapitulatif : Démarche des indicateurs de représentation 2026",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("La déclaration a été transmise le 10/03/2026"),
		).toBeInTheDocument();
		expect(mocks.ensurePdfFontsRegistered).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("pdf-page")).toHaveAttribute("data-size", "A4");
	});

	it("dates the transmission without a date when none is known", () => {
		renderDocument({ transmittedAt: null });

		expect(
			screen.getByText("La déclaration a été transmise"),
		).toBeInTheDocument();
	});

	it("lays out the information banner and its sections in maquette order", () => {
		const { container } = renderDocument();
		const text = container.textContent ?? "";
		const order = [
			"Informations",
			"Déclarant",
			"Entreprise",
			"Calcul",
			"Écarts de représentation",
			"Publication",
		].map((heading) =>
			text.indexOf(heading, text.indexOf("La déclaration a été transmise")),
		);

		expect(order.every((index) => index >= 0)).toBe(true);
		expect([...order].sort((a, b) => a - b)).toEqual(order);
	});

	it("shows the declarant, the company and the reference period", () => {
		renderDocument();

		for (const value of [
			"Marie Dupont",
			"marie.dupont@alphasolutions.com",
			"06 01 02 03 04",
			"Numéro de téléphone",
			"Alpha Solutions",
			"123 456 789",
			"12 rue des Innovateurs, 75011 Paris, France",
			"62.02A - Conseil en systèmes et logiciels informatiques",
			"Effectif annuel moyen en 2025",
			"2 256",
			"01/01/2025 - 31/12/2025",
		]) {
			expect(screen.getByText(value)).toBeInTheDocument();
		}
	});

	it("shows a single non-renseigné line when the declarant has no row", () => {
		renderDocument({ declarantRows: [] });

		expect(screen.getByText("Non renseigné")).toBeInTheDocument();
		expect(screen.queryByText("Nom Prénom")).not.toBeInTheDocument();
	});

	it("renders a computable indicator as a 3-column table with its compliance badge", () => {
		renderDocument({
			indicators: [
				{
					title: "Cadres dirigeants",
					notComputableReason: null,
					womenPercent: 35,
					menPercent: 65,
					verdict: "compliant",
				},
			],
		});

		expect(screen.getByText("Cadres dirigeants")).toBeInTheDocument();
		expect(screen.getByText("Femmes")).toBeInTheDocument();
		expect(screen.getByText("Hommes")).toBeInTheDocument();
		expect(screen.getByText("Conformité")).toBeInTheDocument();
		expect(screen.getByText("35 %")).toBeInTheDocument();
		expect(screen.getByText("65 %")).toBeInTheDocument();
		expect(screen.getByText("CONFORME")).toBeInTheDocument();
	});

	it("marks a non-compliant indicator with the warning badge", () => {
		renderDocument({
			indicators: [
				{
					title: "Membres des instances dirigeantes",
					notComputableReason: null,
					womenPercent: 25,
					menPercent: 75,
					verdict: "non_compliant",
				},
			],
		});

		expect(screen.getByText("NON CONFORME")).toBeInTheDocument();
	});

	it("replaces the table with the motive and the not-computable badge", () => {
		renderDocument({
			indicators: [
				{
					title: "Cadres dirigeants",
					notComputableReason: "Un cadre dirigeant",
					womenPercent: null,
					menPercent: null,
					verdict: "not_applicable",
				},
			],
		});

		expect(screen.getByText("Un cadre dirigeant")).toBeInTheDocument();
		expect(screen.getByText("NON CALCULABLE")).toBeInTheDocument();
		expect(screen.queryByText("Femmes")).not.toBeInTheDocument();
		expect(screen.queryByText("Conformité")).not.toBeInTheDocument();
	});

	it("shows the publication page address when there is a website", () => {
		renderDocument({
			hasWebsite: true,
			publishUrl: "https://exemple.fr/egalite-professionnelle",
			publishModalities: null,
		});

		expect(screen.getByText("Publication")).toBeInTheDocument();
		expect(screen.getByText("31/12/2026")).toBeInTheDocument();
		expect(
			screen.getByText("Site internet de publication"),
		).toBeInTheDocument();
		expect(screen.getByText("Oui")).toBeInTheDocument();
		expect(screen.getByText("Adresse de la page (URL)")).toBeInTheDocument();
		expect(
			screen.getByText("https://exemple.fr/egalite-professionnelle"),
		).toBeInTheDocument();
	});

	it("shows the communication modalities when there is no website", () => {
		renderDocument();

		expect(screen.getByText("Non")).toBeInTheDocument();
		expect(screen.getByText("Modalités de communication")).toBeInTheDocument();
		expect(screen.getByText("Affichage dans les locaux.")).toBeInTheDocument();
	});

	it.each([
		true,
		false,
	])("dashes out an empty publication detail (hasWebsite: %s)", (hasWebsite) => {
		renderDocument({ hasWebsite, publishUrl: null, publishModalities: null });

		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("dashes out a missing publication date", () => {
		renderDocument({ publishDate: null });

		expect(screen.getByText("Date de publication")).toBeInTheDocument();
		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("omits the publication section entirely when no gap is computable", () => {
		renderDocument({ publicationApplicable: false });

		expect(screen.queryByText("Publication")).not.toBeInTheDocument();
		expect(screen.queryByText("Date de publication")).not.toBeInTheDocument();
	});

	it("repeats the campaign year, the formatted siren and the transmission date in the footer", () => {
		renderDocument();

		expect(
			screen.getByText(
				"Démarche des indicateurs de représentation 2026 - SIREN 123 456 789 - transmise le 10/03/2026",
			),
		).toBeInTheDocument();
	});

	it("leaves out the transmission date from the footer when it is unknown", () => {
		renderDocument({ transmittedAt: null });

		expect(
			screen.getByText(
				"Démarche des indicateurs de représentation 2026 - SIREN 123 456 789",
			),
		).toBeInTheDocument();
	});
});
