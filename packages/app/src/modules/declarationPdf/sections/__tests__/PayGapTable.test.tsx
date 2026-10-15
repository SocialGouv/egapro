import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import { emptyStep2Data } from "~/modules/declaration-remuneration/recapitulatif/__tests__/fixtures";
import { noPayGapReferences } from "~/test/gipGapFixtures";
import { PayGapTable, step2PayGapRows } from "../PayGapTable";

describe("PayGapTable", () => {
	it("renders the empty-state message when every row is blank", () => {
		render(
			<PayGapTable
				rows={[
					{ label: "Annuelle brute moyenne", women: "", men: "" },
					{ label: "Horaire brute moyenne", women: "", men: "" },
				]}
			/>,
		);
		expect(screen.getByText("Aucune donnée renseignée.")).toBeInTheDocument();
	});

	it("renders formatted amounts, the regulatory hint and a computed gap", () => {
		render(
			<PayGapTable
				rows={[
					{ label: "Annuelle brute moyenne", women: "45000", men: "50000" },
				]}
			/>,
		);
		expect(screen.getByText("Annuelle brute moyenne")).toBeInTheDocument();
		expect(screen.getByText("45 000 €")).toBeInTheDocument();
		expect(screen.getByText("50 000 €")).toBeInTheDocument();
		expect(screen.getByText("Seuil réglementaire : 5%")).toBeInTheDocument();
		// (50000 - 45000) / 50000 * 100 = 10 %
		expect(screen.getByText("10,00 %")).toBeInTheDocument();
	});

	it("badges a row whose gap reaches the threshold", () => {
		render(
			<PayGapTable
				rows={[{ label: "Horaire brute moyenne", women: "22", men: "24" }]}
			/>,
		);
		// (24 - 22) / 24 * 100 = 8,3 %
		expect(screen.getByText("ÉLEVÉ")).toBeInTheDocument();
	});

	it("renders the favored sex under an unsigned gap with the favoredSex variant", () => {
		render(
			<PayGapTable
				gapVariant="favoredSex"
				rows={[{ label: "Horaire brute moyenne", women: "24", men: "22" }]}
			/>,
		);
		expect(screen.getByText("9,09 %")).toBeInTheDocument();
		expect(screen.getByText("en faveur des femmes")).toBeInTheDocument();
	});
});

describe("step2PayGapRows", () => {
	it("lays out the four mean and median rows with their references", () => {
		const step2Gaps = noPayGapReferences();
		const rows = step2PayGapRows({
			step2Data: {
				...emptyStep2Data(),
				indicatorAAnnualWomen: "1",
				indicatorAHourlyMen: "2",
				indicatorCAnnualWomen: "3",
				indicatorCHourlyMen: "4",
			},
			step2Gaps,
		});
		expect(rows.map((row) => row.label)).toEqual([
			"Annuelle brute moyenne",
			"Horaire brute moyenne",
			"Annuelle brute médiane",
			"Horaire brute médiane",
		]);
		expect(rows.map((row) => [row.women, row.men])).toEqual([
			["1", ""],
			["", "2"],
			["3", ""],
			["", "4"],
		]);
		expect(rows.map((row) => row.reference)).toEqual(step2Gaps);
	});
});
