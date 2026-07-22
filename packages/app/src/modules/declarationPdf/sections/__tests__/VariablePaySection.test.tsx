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
		PayGapTable: () =>
			React.createElement("div", { "data-testid": "pay-gap-table" }),
	};
});

import { VariablePaySection } from "../VariablePaySection";

function makeData(
	step3: Partial<Step3Data>,
	totals: { totalWomen: number; totalMen: number },
): DeclarationPdfData {
	return {
		year: 2026,
		workforceYear: 2025,
		isSecondDeclaration: false,
		transmittedAt: "05/03/2026",
		referencePeriod: "01/01/2026 - 31/12/2026",
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
		step2Data: emptyStep2Data(),
		step3Data: { ...emptyStep3Data(), ...step3 },
		step4Data: emptyStep4Data(),
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
					{ totalWomen: 200, totalMen: 100 },
				)}
			/>,
		);
		expect(screen.getByText("47,5 %")).toBeInTheDocument();
		expect(screen.getByText("80,0 %")).toBeInTheDocument();
	});

	it("renders the '- %' placeholder when a beneficiary count is missing", () => {
		render(
			<VariablePaySection
				data={makeData(
					{ indicatorEWomen: "", indicatorEMen: "" },
					{ totalWomen: 200, totalMen: 100 },
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
					{ totalWomen: 0, totalMen: 0 },
				)}
			/>,
		);
		expect(screen.getAllByText("- %")).toHaveLength(2);
	});
});
