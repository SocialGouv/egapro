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

import { PayGapTable } from "../PayGapTable";

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
		expect(screen.getByText("en faveur des hommes")).toBeInTheDocument();
	});

	it("keeps the signed GIP reference when displayed amounts are equal", () => {
		render(
			<PayGapTable
				rows={[
					{
						label: "Horaire brute moyenne",
						women: "0.10",
						men: "0.10",
						reference: { women: "0.10", men: "0.10", gap: "-0.0719" },
					},
				]}
			/>,
		);
		expect(screen.getByText("7,19 %")).toBeInTheDocument();
		expect(screen.getByText("en faveur des femmes")).toBeInTheDocument();
		expect(screen.getByText("ÉLEVÉ")).toBeInTheDocument();
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
});
