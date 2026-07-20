import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
	DeclarationPdfData,
	VariablePayData,
} from "~/modules/declarationPdf/types";

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");

	return {
		Text: ({ children }: { children: React.ReactNode }) =>
			React.createElement("span", null, children),
		View: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children),
		StyleSheet: {
			create: <T,>(styles: T) => styles,
		},
	};
});

vi.mock("../PayGapTable", async () => {
	const React = await import("react");

	return {
		PayGapTable: ({ title }: { title: string }) =>
			React.createElement("div", { "data-testid": "pay-gap-table" }, title),
	};
});

import { VariablePaySection } from "../VariablePaySection";

const makeData = (
	step3: VariablePayData,
	totals: { totalWomen: number; totalMen: number },
): DeclarationPdfData => ({
	companyName: "Société Démo",
	siren: "123456789",
	year: 2026,
	generatedAt: "10 mars 2026",
	isSecondDeclaration: false,
	totalWomen: totals.totalWomen,
	totalMen: totals.totalMen,
	step1Categories: [],
	step2Rows: [],
	step3Data: step3,
	step4Categories: [],
	step5Categories: [],
});

const beneficiaryRows: VariablePayData["rows"] = [
	{ label: "Primes", womenValue: "5000", menValue: "6000" },
];

describe("VariablePaySection", () => {
	it("renders beneficiary proportion as a share of the workforce total, not the raw beneficiary count", () => {
		render(
			<VariablePaySection
				data={makeData(
					{
						rows: beneficiaryRows,
						beneficiaryWomen: "95",
						beneficiaryMen: "80",
					},
					{ totalWomen: 200, totalMen: 100 },
				)}
			/>,
		);

		expect(screen.getByText("47,5 %")).toBeInTheDocument();
		expect(screen.getByText("80,0 %")).toBeInTheDocument();
		expect(screen.queryByText("95 %")).not.toBeInTheDocument();
		expect(screen.queryByText("110 %")).not.toBeInTheDocument();
	});

	it("renders '-' for the proportion when the workforce total is zero", () => {
		render(
			<VariablePaySection
				data={makeData(
					{
						rows: beneficiaryRows,
						beneficiaryWomen: "95",
						beneficiaryMen: "80",
					},
					{ totalWomen: 0, totalMen: 0 },
				)}
			/>,
		);

		expect(screen.getAllByText("- %")).toHaveLength(2);
	});

	it("omits the proportion row when there are no beneficiary rows", () => {
		render(
			<VariablePaySection
				data={makeData(
					{ rows: [], beneficiaryWomen: "95", beneficiaryMen: "80" },
					{ totalWomen: 200, totalMen: 100 },
				)}
			/>,
		);

		expect(
			screen.queryByText("Proportion de bénéficiaires — Femmes"),
		).not.toBeInTheDocument();
	});
});
