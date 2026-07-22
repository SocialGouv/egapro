import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	emptyStep2Data,
	emptyStep3Data,
	emptyStep4Data,
	makeCategory,
} from "~/modules/declaration-remuneration/recapitulatif/__tests__/fixtures";
import type { DeclarationPdfData } from "../types";

const mocks = vi.hoisted(() => ({
	ensurePdfFontsRegistered: vi.fn(),
	workforceSection: vi.fn(),
	variablePaySection: vi.fn(),
	quartileSection: vi.fn(),
	categorySection: vi.fn(),
	payGapTable: vi.fn(),
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

vi.mock("../sections/WorkforceSection", async () => {
	const React = await import("react");
	return {
		WorkforceSection: () => {
			mocks.workforceSection();
			return React.createElement("div", {
				"data-testid": "workforce-section",
			});
		},
	};
});

vi.mock("../sections/VariablePaySection", async () => {
	const React = await import("react");
	return {
		VariablePaySection: () => {
			mocks.variablePaySection();
			return React.createElement("div", {
				"data-testid": "variable-pay-section",
			});
		},
	};
});

vi.mock("../sections/QuartileSection", async () => {
	const React = await import("react");
	return {
		QuartileSection: () => {
			mocks.quartileSection();
			return React.createElement("div", {
				"data-testid": "quartile-section",
			});
		},
	};
});

vi.mock("../sections/CategorySection", async () => {
	const React = await import("react");
	return {
		CategorySection: () => {
			mocks.categorySection();
			return React.createElement("div", {
				"data-testid": "category-section",
			});
		},
	};
});

vi.mock("../sections/PayGapTable", async () => {
	const React = await import("react");
	return {
		PayGapTable: () => {
			mocks.payGapTable();
			return React.createElement("div", { "data-testid": "pay-gap-table" });
		},
	};
});

import { DeclarationPdfDocument } from "../DeclarationPdfDocument";

function makeData(
	overrides: Partial<DeclarationPdfData> = {},
): DeclarationPdfData {
	return {
		year: 2026,
		workforceYear: 2025,
		isSecondDeclaration: false,
		transmittedAt: "05/03/2026",
		referencePeriod: "01/01/2026 - 31/12/2026",
		declarant: {
			name: "Jean Martin",
			email: "email@example.fr",
			phone: "0102030405",
		},
		company: {
			name: "Société Démo",
			siren: "123456789",
			address: "1 rue de la Paix, 75002 Paris",
			nafCode: "6201Z",
			nafLabel: "Programmation informatique",
			workforceDisplay: "250",
		},
		totalWomen: 50,
		totalMen: 60,
		step2Data: emptyStep2Data(),
		step3Data: emptyStep3Data(),
		step4Data: emptyStep4Data(),
		categories: [makeCategory({ name: "Ouvriers" })],
		source: "Accord d'entreprise",
		...overrides,
	};
}

describe("DeclarationPdfDocument", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("registers fonts and renders an A4 page", () => {
		render(<DeclarationPdfDocument data={makeData()} />);
		expect(mocks.ensurePdfFontsRegistered).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("pdf-page")).toHaveAttribute("data-size", "A4");
	});

	it("renders the initial-declaration title and the transmission date", () => {
		render(<DeclarationPdfDocument data={makeData()} />);
		expect(
			screen.getByText(
				"Récapitulatif de la déclaration des indicateurs de rémunération 2026",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("La déclaration a été transmise le 05/03/2026"),
		).toBeInTheDocument();
	});

	it("renders declarant, company (formatted SIREN + NAF) and reference-period info", () => {
		render(<DeclarationPdfDocument data={makeData()} />);
		expect(screen.getByText("Jean Martin")).toBeInTheDocument();
		expect(screen.getByText("email@example.fr")).toBeInTheDocument();
		expect(screen.getByText("123 456 789")).toBeInTheDocument();
		expect(
			screen.getByText("6201Z - Programmation informatique"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Effectif annuel moyen en 2025"),
		).toBeInTheDocument();
		expect(screen.getByText("250")).toBeInTheDocument();
		expect(screen.getByText("01/01/2026 - 31/12/2026")).toBeInTheDocument();
	});

	it("renders every indicator section for an initial declaration", () => {
		render(<DeclarationPdfDocument data={makeData()} />);
		expect(mocks.workforceSection).toHaveBeenCalledTimes(1);
		expect(mocks.variablePaySection).toHaveBeenCalledTimes(1);
		expect(mocks.quartileSection).toHaveBeenCalledTimes(1);
		expect(mocks.payGapTable).toHaveBeenCalledTimes(1);
		expect(mocks.categorySection).toHaveBeenCalledTimes(1);
	});

	it("renders the correction title and gates the indicator sections to categories only", () => {
		render(
			<DeclarationPdfDocument data={makeData({ isSecondDeclaration: true })} />,
		);
		expect(
			screen.getByText(
				"Récapitulatif de la seconde déclaration des écarts de rémunération par catégorie de salariés 2026",
			),
		).toBeInTheDocument();

		expect(mocks.workforceSection).not.toHaveBeenCalled();
		expect(mocks.variablePaySection).not.toHaveBeenCalled();
		expect(mocks.quartileSection).not.toHaveBeenCalled();
		expect(mocks.payGapTable).not.toHaveBeenCalled();
		// Categories are always rendered, in both variants.
		expect(mocks.categorySection).toHaveBeenCalledTimes(1);
	});

	it("renders a dash for the NAF cell when neither code nor label is present", () => {
		render(
			<DeclarationPdfDocument
				data={makeData({
					company: {
						...makeData().company,
						nafCode: null,
						nafLabel: null,
					},
				})}
			/>,
		);
		expect(screen.getByText("-")).toBeInTheDocument();
	});

	it("renders the NAF cell with only the code when the label is missing", () => {
		render(
			<DeclarationPdfDocument
				data={makeData({
					company: { ...makeData().company, nafLabel: null },
				})}
			/>,
		);
		expect(screen.getByText("6201Z")).toBeInTheDocument();
	});
});
