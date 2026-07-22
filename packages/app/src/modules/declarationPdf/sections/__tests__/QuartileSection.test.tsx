import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
	emptyStep4Data,
	makeCategory,
} from "~/modules/declaration-remuneration/recapitulatif/__tests__/fixtures";
import type {
	QuartileData,
	Step4Data,
} from "~/modules/declaration-remuneration/types";
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

import { QuartileSection } from "../QuartileSection";

function makeData(step4: Step4Data): DeclarationPdfData {
	return {
		year: 2026,
		workforceYear: 2025,
		isSecondDeclaration: false,
		transmittedAt: "05/03/2026",
		referencePeriod: "01/01/2026 - 31/12/2026",
		declarant: { name: "", email: "", phone: "" },
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
		step2Data: {} as DeclarationPdfData["step2Data"],
		step3Data: {} as DeclarationPdfData["step3Data"],
		step4Data: step4,
		categories: [makeCategory()],
		source: null,
	};
}

describe("QuartileSection", () => {
	it("renders '- €' and '- %' placeholders for a fully empty quartile grid", () => {
		render(<QuartileSection data={makeData(emptyStep4Data() as Step4Data)} />);
		expect(screen.getAllByText("- €").length).toBeGreaterThan(0);
		expect(screen.getAllByText("- %").length).toBeGreaterThan(0);
	});

	it("renders quartile thresholds, counts and percentages when populated", () => {
		const annual: QuartileData[] = [
			{ threshold: "40000", women: 10, men: 15 },
			{ threshold: "50000", women: 12, men: 13 },
			{ threshold: "60000", women: 14, men: 12 },
			{ threshold: undefined, women: 14, men: 10 },
		];
		render(
			<QuartileSection
				data={makeData({
					annual,
					hourly: emptyStep4Data().hourly as QuartileData[],
				})}
			/>,
		);
		// "1er quartile" appears once per (annual + hourly) table.
		expect(screen.getAllByText("1er quartile")).toHaveLength(2);
		expect(screen.getAllByText("40 000 €").length).toBeGreaterThan(0);
		// First quartile line total 10 + 15 = 25 → women 40,0 %
		expect(screen.getByText("40,0 %")).toBeInTheDocument();
		expect(screen.getAllByText("Tous les salariés")).toHaveLength(2);
	});

	it("renders '- €' when a threshold is present but not a number", () => {
		const annual: QuartileData[] = [
			{ threshold: "abc", women: 1, men: 1 },
			{ threshold: "50000", women: 1, men: 1 },
			{ threshold: "60000", women: 1, men: 1 },
			{ threshold: undefined, women: 1, men: 1 },
		];
		render(
			<QuartileSection
				data={makeData({
					annual,
					hourly: emptyStep4Data().hourly as QuartileData[],
				})}
			/>,
		);
		// Second quartile's lower bound reads the first quartile's non-numeric threshold.
		expect(screen.getAllByText("- €").length).toBeGreaterThan(0);
	});
});
