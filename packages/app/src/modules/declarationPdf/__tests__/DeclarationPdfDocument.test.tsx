import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeclarationPdfData } from "../types";

const mocks = vi.hoisted(() => ({
	ensurePdfFontsRegistered: vi.fn(),
	workforceSection: vi.fn(),
	payGapTable: vi.fn(),
	variablePaySection: vi.fn(),
	quartileSection: vi.fn(),
	categorySection: vi.fn(),
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

vi.mock("../sections/WorkforceSection", async () => {
	const React = await import("react");

	return {
		WorkforceSection: ({ data }: { data: DeclarationPdfData }) => {
			mocks.workforceSection({ data });
			return React.createElement(
				"div",
				{ "data-testid": "workforce-section" },
				`${data.totalWomen}/${data.totalMen}`,
			);
		},
	};
});

vi.mock("../sections/PayGapTable", async () => {
	const React = await import("react");

	return {
		PayGapTable: ({
			rows,
			title,
		}: {
			rows: DeclarationPdfData["step2Rows"];
			title: string;
		}) => {
			mocks.payGapTable({ rows, title });
			return React.createElement(
				"div",
				{ "data-testid": "pay-gap-table" },
				title,
			);
		},
	};
});

vi.mock("../sections/VariablePaySection", async () => {
	const React = await import("react");

	return {
		VariablePaySection: ({ data }: { data: DeclarationPdfData }) => {
			mocks.variablePaySection({ data });
			return React.createElement(
				"div",
				{ "data-testid": "variable-pay-section" },
				data.step3Data.rows.length,
			);
		},
	};
});

vi.mock("../sections/QuartileSection", async () => {
	const React = await import("react");

	return {
		QuartileSection: ({ data }: { data: DeclarationPdfData }) => {
			mocks.quartileSection({ data });
			return React.createElement(
				"div",
				{ "data-testid": "quartile-section" },
				data.step4Categories.length,
			);
		},
	};
});

vi.mock("../sections/CategorySection", async () => {
	const React = await import("react");

	return {
		CategorySection: ({ data }: { data: DeclarationPdfData }) => {
			mocks.categorySection({ data });
			return React.createElement(
				"div",
				{ "data-testid": "category-section" },
				data.step5Categories.length,
			);
		},
	};
});

import { DeclarationPdfDocument } from "../DeclarationPdfDocument";

const declarationPdfData: DeclarationPdfData = {
	companyName: "Acme Corp",
	siren: "123456789",
	year: 2026,
	generatedAt: "10 mars 2026",
	isSecondDeclaration: false,
	totalWomen: 50,
	totalMen: 60,
	step1Categories: [{ name: "Cadres", women: 20, men: 30 }],
	step2Rows: [
		{
			label: "Annuelle brute moyenne",
			womenValue: "45000",
			menValue: "50000",
		},
	],
	step3Data: {
		beneficiaryWomen: "80",
		beneficiaryMen: "75",
		rows: [
			{
				label: "Primes",
				womenValue: "5000",
				menValue: "6000",
			},
		],
	},
	step4Categories: [
		{
			name: "Q1",
			womenCount: 10,
			menCount: 15,
			womenValue: "40000",
			menValue: "42000",
			womenMedianValue: undefined,
			menMedianValue: undefined,
		},
	],
	step5Categories: [
		{
			name: "Ingénieurs",
			detail: "",
			womenCount: 5,
			menCount: 8,
			annualBaseWomen: "55000",
			annualBaseMen: "58000",
			annualVariableWomen: null,
			annualVariableMen: null,
			hourlyBaseWomen: null,
			hourlyBaseMen: null,
			hourlyVariableWomen: null,
			hourlyVariableMen: null,
		},
	],
};

describe("DeclarationPdfDocument", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the declaration header, footer, and PDF sections", () => {
		render(<DeclarationPdfDocument data={declarationPdfData} />);

		expect(mocks.ensurePdfFontsRegistered).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
		expect(screen.getByTestId("pdf-page")).toHaveAttribute("data-size", "A4");
		expect(
			screen.getByText("Déclaration des indicateurs de rémunération 2026"),
		).toBeInTheDocument();
		expect(screen.getByText("Au titre des données 2025")).toBeInTheDocument();
		expect(screen.getByText("Acme Corp — SIREN 123456789")).toBeInTheDocument();
		expect(screen.getByText("Écart de rémunération")).toBeInTheDocument();
		expect(
			screen.getByText("Document généré le 10 mars 2026"),
		).toBeInTheDocument();
		expect(screen.getByTestId("workforce-section")).toHaveTextContent("50/60");
		expect(screen.getByTestId("variable-pay-section")).toHaveTextContent("1");
		expect(screen.getByTestId("quartile-section")).toHaveTextContent("1");
		expect(screen.getByTestId("category-section")).toHaveTextContent("1");
	});

	it("passes the expected props to each PDF section", () => {
		render(<DeclarationPdfDocument data={declarationPdfData} />);

		expect(mocks.workforceSection).toHaveBeenCalledWith({
			data: declarationPdfData,
		});
		expect(mocks.payGapTable).toHaveBeenCalledWith({
			rows: declarationPdfData.step2Rows,
			title: "Écart de rémunération",
		});
		expect(mocks.variablePaySection).toHaveBeenCalledWith({
			data: declarationPdfData,
		});
		expect(mocks.quartileSection).toHaveBeenCalledWith({
			data: declarationPdfData,
		});
		expect(mocks.categorySection).toHaveBeenCalledWith({
			data: declarationPdfData,
		});
	});

	it("renders second declaration title when isSecondDeclaration is true", () => {
		const secondDeclData = {
			...declarationPdfData,
			isSecondDeclaration: true,
		};
		render(<DeclarationPdfDocument data={secondDeclData} />);

		expect(
			screen.getByText(
				/Seconde déclaration de l.indicateur de rémunération par catégorie de salariés 2026/,
			),
		).toBeInTheDocument();
	});
});
