import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TransmittedPdfData } from "../buildTransmittedPdfData";

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

import { TransmittedPdfDocument } from "../TransmittedPdfDocument";

const transmittedPdfData: TransmittedPdfData = {
	companyName: "Acme Corp",
	siren: "123456789",
	dataYear: 2024,
	year: 2025,
	generatedAt: "10 mars 2026",
	opinions: [
		{
			declarationNumber: 1,
			type: "initial",
			opinion: "favorable",
			opinionDate: "2026-01-15",
			gapConsulted: true,
		},
		{
			declarationNumber: 2,
			type: "rectificative",
			opinion: "unfavorable",
			opinionDate: "2026-02-20",
			gapConsulted: false,
		},
	],
	cseFiles: [
		{
			fileName: "avis-cse-2026.pdf",
			uploadedAt: new Date(2026, 0, 20),
		},
		{
			fileName: "avis-cse-rectificatif.pdf",
			uploadedAt: new Date(2026, 1, 25),
		},
	],
	jointEvaluationFile: {
		fileName: "evaluation-conjointe.pdf",
		uploadedAt: new Date(2026, 2, 1),
	},
};

describe("TransmittedPdfDocument", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the header with title, subtitle, and company info", () => {
		render(<TransmittedPdfDocument data={transmittedPdfData} />);

		expect(mocks.ensurePdfFontsRegistered).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
		expect(screen.getByTestId("pdf-page")).toHaveAttribute("data-size", "A4");
		expect(
			screen.getByText("Récapitulatif des éléments transmis 2026"),
		).toBeInTheDocument();
		expect(screen.getByText("Au titre des données 2024")).toBeInTheDocument();
		expect(screen.getByText("Acme Corp — SIREN 123456789")).toBeInTheDocument();
	});

	it("renders CSE opinion sections grouped by declaration number", () => {
		render(<TransmittedPdfDocument data={transmittedPdfData} />);

		expect(screen.getByText("Avis du CSE")).toBeInTheDocument();
		expect(screen.getByText("1re déclaration")).toBeInTheDocument();
		expect(screen.getByText("2e déclaration")).toBeInTheDocument();
		expect(screen.getByText("Avis : Favorable")).toBeInTheDocument();
		expect(screen.getByText("Avis : Défavorable")).toBeInTheDocument();
	});

	it("renders CSE file names and upload dates", () => {
		render(<TransmittedPdfDocument data={transmittedPdfData} />);

		expect(screen.getByText("Fichiers avis CSE")).toBeInTheDocument();
		expect(screen.getByText("avis-cse-2026.pdf")).toBeInTheDocument();
		expect(screen.getByText("avis-cse-rectificatif.pdf")).toBeInTheDocument();
	});

	it("renders the joint evaluation file section", () => {
		render(<TransmittedPdfDocument data={transmittedPdfData} />);

		expect(screen.getByText("Évaluation conjointe")).toBeInTheDocument();
		expect(screen.getByText("evaluation-conjointe.pdf")).toBeInTheDocument();
	});

	it("renders the footer with generation date", () => {
		render(<TransmittedPdfDocument data={transmittedPdfData} />);

		expect(
			screen.getByText("Document généré le 10 mars 2026"),
		).toBeInTheDocument();
	});

	it("renders empty state messages when data is empty", () => {
		const emptyData: TransmittedPdfData = {
			companyName: "Empty Corp",
			siren: "987654321",
			dataYear: 2024,
			year: 2025,
			generatedAt: "15 mars 2026",
			opinions: [],
			cseFiles: [],
			jointEvaluationFile: null,
		};

		render(<TransmittedPdfDocument data={emptyData} />);

		expect(screen.getByText("Aucun avis enregistré")).toBeInTheDocument();
		expect(screen.getAllByText("Aucun fichier déposé")).toHaveLength(2);
		expect(
			screen.getByText("Empty Corp — SIREN 987654321"),
		).toBeInTheDocument();
	});

	it("formats opinion details correctly", () => {
		render(<TransmittedPdfDocument data={transmittedPdfData} />);

		expect(screen.getByText("Type : initial")).toBeInTheDocument();
		expect(screen.getByText("Type : rectificative")).toBeInTheDocument();
		expect(screen.getByText("Date : 2026-01-15")).toBeInTheDocument();
		expect(screen.getByText("Date : 2026-02-20")).toBeInTheDocument();
	});

	it("displays gap consulted status for each opinion", () => {
		render(<TransmittedPdfDocument data={transmittedPdfData} />);

		expect(screen.getByText("Écart consulté : Oui")).toBeInTheDocument();
		expect(screen.getByText("Écart consulté : Non")).toBeInTheDocument();
	});

	it("handles opinion with null opinion value", () => {
		const dataWithNullOpinion: TransmittedPdfData = {
			...transmittedPdfData,
			opinions: [
				{
					declarationNumber: 1,
					type: "initial",
					opinion: null,
					opinionDate: null,
					gapConsulted: null,
				},
			],
		};

		render(<TransmittedPdfDocument data={dataWithNullOpinion} />);

		expect(screen.getByText("Date : Non renseignée")).toBeInTheDocument();
		expect(screen.getByText("Écart consulté : Non")).toBeInTheDocument();
	});
});
