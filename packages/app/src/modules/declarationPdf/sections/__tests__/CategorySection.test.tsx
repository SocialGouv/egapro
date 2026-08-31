import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeCategory } from "~/modules/declaration-remuneration/recapitulatif/__tests__/fixtures";
import type { DeclarationPdfData } from "~/modules/declarationPdf/types";

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	return {
		Text: ({ children }: { children: React.ReactNode }) =>
			React.createElement("span", null, children),
		View: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

import { noPayGapReferences } from "~/test/gipGapFixtures";
import { CategorySection } from "../CategorySection";

function makeData(overrides: Partial<DeclarationPdfData>): DeclarationPdfData {
	return {
		year: 2026,
		workforceYear: 2025,
		isSecondDeclaration: false,
		transmittedAt: "05/03/2026",
		referencePeriod: "01/01/2025 - 31/12/2025",
		declarant: { name: "Jean Martin", email: "email@example.fr", phone: "" },
		company: {
			name: "Société Démo",
			siren: "123456789",
			address: "",
			nafCode: null,
			nafLabel: null,
			workforceDisplay: "250",
		},
		totalWomen: 0,
		totalMen: 0,
		hourlyWomen: 0,
		hourlyMen: 0,
		step2Data: {} as DeclarationPdfData["step2Data"],
		step3Data: {} as DeclarationPdfData["step3Data"],
		step4Data: { annual: [], hourly: [] },
		step2Gaps: noPayGapReferences(),
		step3Gaps: noPayGapReferences(),
		categories: [],
		source: null,
		...overrides,
	};
}

describe("CategorySection", () => {
	it("renders the empty-state message when there is no category", () => {
		render(<CategorySection data={makeData({ categories: [] })} />);
		expect(screen.getByText("Aucune donnée renseignée.")).toBeInTheDocument();
	});

	it("labels the source and numbers each category block by position", () => {
		render(
			<CategorySection
				data={makeData({
					source: "Accord d'entreprise",
					categories: [
						makeCategory({ name: "Ouvriers", womenCount: 10, menCount: 15 }),
						makeCategory({ name: "Cadres" }),
					],
				})}
			/>,
		);
		expect(screen.getByText("Source")).toBeInTheDocument();
		expect(screen.getByText("Accord d'entreprise")).toBeInTheDocument();
		expect(
			screen.getByText("Catégorie d'emplois n°1 : Ouvriers"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Catégorie d'emplois n°2 : Cadres"),
		).toBeInTheDocument();
	});

	it("renders a dash for the source when none was provided", () => {
		render(
			<CategorySection
				data={makeData({
					source: null,
					categories: [
						makeCategory({
							name: "Ouvriers",
							womenCount: 10,
							menCount: 15,
							annualBaseWomen: "40000",
							annualBaseMen: "42000",
							annualVariableWomen: "1000",
							annualVariableMen: "2000",
							hourlyBaseWomen: "22",
							hourlyBaseMen: "24",
							hourlyVariableWomen: "1",
							hourlyVariableMen: "2",
						}),
					],
				})}
			/>,
		);
		// With every pay cell populated, the only bare "-" left is the Source value.
		expect(screen.getByText("-")).toBeInTheDocument();
	});

	it("numbers an unnamed category without a trailing label", () => {
		render(
			<CategorySection
				data={makeData({ categories: [makeCategory({ name: "" })] })}
			/>,
		);
		expect(screen.getByText("Catégorie d'emplois n°1")).toBeInTheDocument();
	});

	it("renders the effectif total and the base + variable pay totals for a category", () => {
		render(
			<CategorySection
				data={makeData({
					categories: [
						makeCategory({
							name: "Ouvriers",
							womenCount: 10,
							menCount: 15,
							annualBaseWomen: "40000",
							annualBaseMen: "42000",
							annualVariableWomen: "1000",
							annualVariableMen: "2000",
						}),
					],
				})}
			/>,
		);
		// Effectif total: 10 + 15 = 25
		expect(screen.getByText("25")).toBeInTheDocument();
		// Women pay total: 40000 + 1000 = 41 000 €
		expect(screen.getByText("41 000 €")).toBeInTheDocument();
		// Men pay total: 42000 + 2000 = 44 000 €
		expect(screen.getByText("44 000 €")).toBeInTheDocument();
	});

	it("shows a dash for a missing hourly headcount, never an invented 0 (#4368)", () => {
		render(
			<CategorySection
				data={makeData({
					categories: [
						makeCategory({ name: "Ouvriers", womenCount: 10, menCount: 15 }),
					],
				})}
			/>,
		);
		expect(screen.getByText("Rémunération annuelle")).toBeInTheDocument();
		expect(screen.getByText("Rémunération horaire")).toBeInTheDocument();
		// The hourly row's Femmes/Hommes/Total cells are all missing → 3 dashes.
		expect(screen.getAllByText("—")).toHaveLength(3);
	});

	it("shows the hourly headcount total once both women and men counts are present (#4368)", () => {
		render(
			<CategorySection
				data={makeData({
					categories: [
						makeCategory({
							name: "Ouvriers",
							womenCount: 10,
							menCount: 15,
							hourlyWomenCount: 4,
							hourlyMenCount: 2,
						}),
					],
				})}
			/>,
		);
		// Hourly total: 4 + 2 = 6
		expect(screen.getByText("6")).toBeInTheDocument();
	});
});
