import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("~/modules/declarationPdf/pdfFonts", () => ({
	PDF_FONT_FAMILY: "Marianne",
	ensurePdfFontsRegistered: mocks.ensurePdfFontsRegistered,
}));

import { NoSanctionPdfDocument } from "../NoSanctionPdfDocument";

const baseData = {
	companyName: "Acme Corp",
	siren: "123456789",
	address: "1 rue de Paris, 75001 Paris",
	generatedAt: "26 mars 2026",
};

describe("NoSanctionPdfDocument", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("registers fonts and renders the document structure", () => {
		render(<NoSanctionPdfDocument data={baseData} />);

		expect(mocks.ensurePdfFontsRegistered).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
		expect(screen.getByTestId("pdf-page")).toHaveAttribute("data-size", "A4");
	});

	it("renders the republic title and attestation title", () => {
		render(<NoSanctionPdfDocument data={baseData} />);

		expect(screen.getByText("RÉPUBLIQUE FRANÇAISE")).toBeInTheDocument();
		expect(
			screen.getByText("Attestation de non sanction"),
		).toBeInTheDocument();
	});

	it("renders the certification body text", () => {
		render(<NoSanctionPdfDocument data={baseData} />);

		expect(
			screen.getByText(/certifie que l'entreprise ci-dessous/),
		).toBeInTheDocument();
	});

	it("renders company information", () => {
		render(<NoSanctionPdfDocument data={baseData} />);

		expect(
			screen.getByText("Raison sociale : Acme Corp"),
		).toBeInTheDocument();
		expect(screen.getByText("SIREN : 123456789")).toBeInTheDocument();
		expect(
			screen.getByText("Adresse : 1 rue de Paris, 75001 Paris"),
		).toBeInTheDocument();
	});

	it("does not render address when it is null", () => {
		render(
			<NoSanctionPdfDocument data={{ ...baseData, address: null }} />,
		);

		expect(screen.queryByText(/Adresse/)).not.toBeInTheDocument();
	});

	it("renders the SUIT source text", () => {
		render(<NoSanctionPdfDocument data={baseData} />);

		expect(screen.getByText(/système SUIT/)).toBeInTheDocument();
	});

	it("renders the generated date in the footer", () => {
		render(<NoSanctionPdfDocument data={baseData} />);

		expect(
			screen.getByText("Document généré le 26 mars 2026"),
		).toBeInTheDocument();
	});
});
