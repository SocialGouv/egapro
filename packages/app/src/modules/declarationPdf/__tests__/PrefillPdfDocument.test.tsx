import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	return {
		Document: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", { "data-testid": "pdf-document" }, children),
		Page: ({ children }: { children: React.ReactNode }) =>
			React.createElement("section", { "data-testid": "pdf-page" }, children),
		Text: ({ children }: { children: React.ReactNode }) =>
			React.createElement("span", null, children),
		View: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

vi.mock("../pdfFonts", () => ({
	PDF_FONT_FAMILY: "Marianne",
	ensurePdfFontsRegistered: vi.fn(),
}));

import { GIP_WORKFORCE_VOLUNTARY_DISPLAY } from "~/modules/domain";
import { type PrefillPdfData, PrefillPdfDocument } from "../PrefillPdfDocument";

function renderPrefill(row: PrefillPdfData["row"]) {
	render(
		<PrefillPdfDocument
			data={{
				siren: "123456789",
				companyName: "Société Démo",
				year: 2026,
				periodStart: "2025-01-01",
				periodEnd: "2025-12-31",
				row,
			}}
		/>,
	);
}

describe("PrefillPdfDocument", () => {
	it("shows the bracket instead of the exact headcount below the voluntary threshold", () => {
		renderPrefill({ workforceEma: "37.00" });

		expect(
			screen.getByText(GIP_WORKFORCE_VOLUNTARY_DISPLAY),
		).toBeInTheDocument();
		expect(screen.queryByText("37")).not.toBeInTheDocument();
		expect(screen.queryByText("37.00")).not.toBeInTheDocument();
	});

	it("shows the bracket, not a dash, when the GIP row carries no headcount", () => {
		// `gip_mds_data.workforce_ema` is nullable and the prefill route only 404s
		// on a missing row, so this reaches the document. The generic empty-value
		// guard used to win and print "—", making this PDF the one surface that
		// answered "unknown" where the other five answer "voluntary tier".
		renderPrefill({ workforceEma: null });

		expect(
			screen.getByText(GIP_WORKFORCE_VOLUNTARY_DISPLAY),
		).toBeInTheDocument();
	});

	it("keeps the exact headcount at or above the threshold", () => {
		renderPrefill({ workforceEma: "250.00" });

		expect(screen.getByText("250")).toBeInTheDocument();
		expect(
			screen.queryByText(GIP_WORKFORCE_VOLUNTARY_DISPLAY),
		).not.toBeInTheDocument();
	});

	it("still prints a dash for the other empty prefilled fields", () => {
		// The workforce branch is an exception, not a new rule: every other field
		// must keep saying "nothing was prefilled here".
		renderPrefill({ workforceEma: "250.00", globalAnnualMeanGap: null });

		expect(screen.getAllByText("—").length).toBeGreaterThan(0);
	});

	it("prints the GIP gap ratios as percentages with two truncated decimals", () => {
		renderPrefill({
			workforceEma: "250.00",
			globalAnnualMeanGap: "0.0887",
			globalHourlyMeanGap: "-0.03168",
		});

		expect(screen.getByText("8,87 %")).toBeInTheDocument();
		expect(screen.getByText("-3,16 %")).toBeInTheDocument();
		expect(screen.queryByText("0.0887")).not.toBeInTheDocument();
	});

	it("prints the GIP proportions as percentages, not as raw ratios", () => {
		renderPrefill({
			workforceEma: "250.00",
			variableProportionWomen: "0.4286",
			variableProportionMen: "0.5000",
			annualQuartile1ProportionWomen: "0.6667",
			annualQuartile1ProportionMen: "0.3333",
		});

		expect(screen.getByText("42,86 %")).toBeInTheDocument();
		expect(screen.getByText("50 %")).toBeInTheDocument();
		expect(screen.getByText("66,67 %")).toBeInTheDocument();
		expect(screen.getByText("33,33 %")).toBeInTheDocument();
		expect(screen.queryByText("0.4286")).not.toBeInTheDocument();
	});
});
