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
		StyleSheet: {
			create: <T,>(styles: T) => styles,
		},
	};
});

vi.mock("../pdfFonts", () => ({
	PDF_FONT_FAMILY: "Marianne",
	ensurePdfFontsRegistered: mocks.ensurePdfFontsRegistered,
}));

import { RepresentationPdfDocument } from "../RepresentationPdfDocument";

const representationPdfData: RepresentationPdfData = {
	companyName: "Société Représentation",
	siren: "123456789",
	year: 2025,
	campaignYear: 2026,
	referencePeriodStart: "2025-01-01",
	referencePeriodEnd: "2025-12-31",
	indicators: [
		{
			title: "Cadres dirigeants",
			notComputableReason: null,
			womenPercent: 60,
			menPercent: 40,
			verdict: "compliant",
		},
		{
			title: "Membres des instances dirigeantes",
			notComputableReason: null,
			womenPercent: 25.5,
			menPercent: 74.5,
			verdict: "non_compliant",
		},
	],
	publicationApplicable: true,
	publishDate: "2026-03-01",
	hasWebsite: true,
	publishUrl: "https://exemple.fr/egalite-professionnelle",
	publishModalities: null,
	submittedAt: new Date("2026-03-10T08:00:00.000Z"),
	generatedAt: new Date("2026-06-15T09:30:00.000Z"),
};

function renderDocument(overrides: Partial<RepresentationPdfData> = {}) {
	return render(
		<RepresentationPdfDocument
			data={{ ...representationPdfData, ...overrides }}
		/>,
	);
}

describe("RepresentationPdfDocument", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders an A4 page titled with the campaign and the reference year", () => {
		renderDocument();

		expect(mocks.ensurePdfFontsRegistered).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
		expect(screen.getByTestId("pdf-page")).toHaveAttribute("data-size", "A4");
		expect(
			screen.getByText("Démarche des indicateurs de représentation 2026"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Au titre de la période de référence 2025"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Société Représentation — SIREN 123456789"),
		).toBeInTheDocument();
	});

	it("renders the reference period in short French dates", () => {
		renderDocument();

		expect(screen.getByText("Période de référence")).toBeInTheDocument();
		expect(screen.getByText("01/01/2025")).toBeInTheDocument();
		expect(screen.getByText("31/12/2025")).toBeInTheDocument();
	});

	it("marks an unfilled reference period boundary as not provided", () => {
		renderDocument({ referencePeriodStart: null, referencePeriodEnd: null });

		expect(screen.getAllByText("Non renseignée")).toHaveLength(2);
	});

	it("renders both indicators with their proportions and verdicts", () => {
		renderDocument();

		expect(screen.getByText("Cadres dirigeants")).toBeInTheDocument();
		expect(
			screen.getByText("Membres des instances dirigeantes"),
		).toBeInTheDocument();
		expect(screen.getByText("60 %")).toBeInTheDocument();
		expect(screen.getByText("40 %")).toBeInTheDocument();
		expect(screen.getByText("25,5 %")).toBeInTheDocument();
		expect(screen.getByText("74,5 %")).toBeInTheDocument();
		expect(screen.getByText("Verdict : Conforme")).toBeInTheDocument();
		expect(screen.getByText("Verdict : Non conforme")).toBeInTheDocument();
	});

	it("replaces the proportions with the motive when the gap is not computable", () => {
		renderDocument({
			indicators: [
				{
					title: "Cadres dirigeants",
					notComputableReason: "Aucun cadre dirigeant",
					womenPercent: null,
					menPercent: null,
					verdict: "not_applicable",
				},
			],
		});

		expect(screen.getByText("Aucun cadre dirigeant")).toBeInTheDocument();
		expect(screen.queryByText("Femmes")).not.toBeInTheDocument();
		expect(screen.getByText("Verdict : Non applicable")).toBeInTheDocument();
	});

	it("renders the publication page address when the company has a website", () => {
		renderDocument();

		expect(screen.getByText("Publication")).toBeInTheDocument();
		expect(screen.getByText("01/03/2026")).toBeInTheDocument();
		expect(screen.getByText("Adresse de la page (URL)")).toBeInTheDocument();
		expect(
			screen.getByText("https://exemple.fr/egalite-professionnelle"),
		).toBeInTheDocument();
	});

	it("renders the communication modalities when the company has no website", () => {
		renderDocument({
			hasWebsite: false,
			publishUrl: null,
			publishModalities: "Affichage dans les locaux.",
		});

		expect(screen.getByText("Modalités de communication")).toBeInTheDocument();
		expect(screen.getByText("Affichage dans les locaux.")).toBeInTheDocument();
	});

	it.each([
		true,
		false,
	])("dashes out the publication detail left empty (website: %s)", (hasWebsite) => {
		renderDocument({
			hasWebsite,
			publishDate: null,
			publishUrl: null,
			publishModalities: null,
		});

		expect(screen.getByText("Non renseignée")).toBeInTheDocument();
		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("states that no publication is due when no gap is computable", () => {
		renderDocument({ publicationApplicable: false });

		expect(
			screen.getByText("Non applicable — aucun écart calculable"),
		).toBeInTheDocument();
		expect(screen.queryByText("Date de publication")).not.toBeInTheDocument();
	});

	it("footers the transmission date alongside the generation date", () => {
		renderDocument();

		expect(
			screen.getByText(/Déclaration transmise le 10 mars 2026/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Document généré le 15 juin 2026/),
		).toBeInTheDocument();
	});

	it("footers the generation date alone when the transmission date is unknown", () => {
		renderDocument({ submittedAt: null });

		expect(screen.queryByText(/Déclaration transmise/)).not.toBeInTheDocument();
		expect(
			screen.getByText(/Document généré le 15 juin 2026/),
		).toBeInTheDocument();
	});
});
