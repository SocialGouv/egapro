import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
	emptyStep2Data,
	emptyStep3Data,
	emptyStep4Data,
} from "~/modules/declaration-remuneration/recapitulatif/__tests__/fixtures";
import type { Step3Data } from "~/modules/declaration-remuneration/types";
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

vi.mock("../PayGapTable", async () => {
	const React = await import("react");
	return {
		PayGapTable: ({ gapVariant }: { gapVariant?: string }) =>
			React.createElement("div", {
				"data-testid": "pay-gap-table",
				"data-variant": gapVariant ?? "signed",
			}),
	};
});

import { noPayGapReferences } from "~/test/gipGapFixtures";
import { VariablePaySection } from "../VariablePaySection";

function makeData(
	step3: Partial<Step3Data>,
	totals: {
		totalWomen: number;
		totalMen: number;
		hourlyWomen: number;
		hourlyMen: number;
	},
): DeclarationPdfData {
	return {
		year: 2026,
		workforceYear: 2025,
		isSecondDeclaration: false,
		indicatorGRequired: true,
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
		totalWomen: totals.totalWomen,
		totalMen: totals.totalMen,
		hourlyWomen: totals.totalWomen,
		hourlyMen: totals.totalMen,
		step2Data: emptyStep2Data(),
		step3Data: { ...emptyStep3Data(), ...step3 },
		step4Data: emptyStep4Data(),
		step2Gaps: noPayGapReferences(),
		step3Gaps: noPayGapReferences(),
		categories: [],
		source: null,
	};
}

describe("VariablePaySection", () => {
	it("computes the beneficiary proportion as a share of the workforce total, not the raw count", () => {
		render(
			<VariablePaySection
				data={makeData(
					{ indicatorEWomen: "95", indicatorEMen: "80" },
					{ totalWomen: 200, totalMen: 100, hourlyWomen: 200, hourlyMen: 100 },
				)}
			/>,
		);
		expect(screen.getByText("47,50 %")).toBeInTheDocument();
		expect(screen.getByText("80,00 %")).toBeInTheDocument();
	});

	it("renders the '- %' placeholder when a beneficiary count is missing", () => {
		render(
			<VariablePaySection
				data={makeData(
					{ indicatorEWomen: "", indicatorEMen: "" },
					{ totalWomen: 200, totalMen: 100, hourlyWomen: 200, hourlyMen: 100 },
				)}
			/>,
		);
		expect(screen.getAllByText("- %")).toHaveLength(2);
	});

	it("renders the '- %' placeholder when the workforce total is zero", () => {
		render(
			<VariablePaySection
				data={makeData(
					{ indicatorEWomen: "95", indicatorEMen: "80" },
					{ totalWomen: 0, totalMen: 0, hourlyWomen: 0, hourlyMen: 0 },
				)}
			/>,
		);
		expect(screen.getAllByText("- %")).toHaveLength(2);
	});

	it("prints dashes when the workforce totals are unknown", () => {
		render(
			<VariablePaySection
				data={{
					totalWomen: null,
					totalMen: null,
					step3Data: {
						...emptyStep3Data(),
						indicatorEWomen: "60",
						indicatorEMen: "70",
					},
					step3Gaps: noPayGapReferences(),
				}}
			/>,
		);
		expect(screen.getByText("Total de salariés : -")).toBeInTheDocument();
		expect(screen.getAllByText("- %")).toHaveLength(2);
		expect(screen.queryByText(/null|NaN/)).not.toBeInTheDocument();
	});

	it("forwards the gap cell variant to the pay gap table", () => {
		render(
			<VariablePaySection
				data={makeData(
					{},
					{ totalWomen: 1, totalMen: 1, hourlyWomen: 1, hourlyMen: 1 },
				)}
				gapVariant="favoredSex"
			/>,
		);
		expect(screen.getByTestId("pay-gap-table")).toHaveAttribute(
			"data-variant",
			"favoredSex",
		);
	});
});
