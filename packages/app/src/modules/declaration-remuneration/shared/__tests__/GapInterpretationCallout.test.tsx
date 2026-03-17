import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PayGapRow } from "~/modules/declaration-remuneration/types";
import { GapInterpretationCallout } from "../GapInterpretationCallout";

/** Helper to build the 4 standard rows used by analyzeGaps. */
function makeRows(overrides: {
	annualMeanW?: string;
	annualMeanM?: string;
	annualMedianW?: string;
	annualMedianM?: string;
	hourlyMeanW?: string;
	hourlyMeanM?: string;
	hourlyMedianW?: string;
	hourlyMedianM?: string;
}): PayGapRow[] {
	return [
		{
			label: "Annuelle brute moyenne",
			womenValue: overrides.annualMeanW ?? "",
			menValue: overrides.annualMeanM ?? "",
		},
		{
			label: "Annuelle brute médiane",
			womenValue: overrides.annualMedianW ?? "",
			menValue: overrides.annualMedianM ?? "",
		},
		{
			label: "Horaire brute moyenne",
			womenValue: overrides.hourlyMeanW ?? "",
			menValue: overrides.hourlyMeanM ?? "",
		},
		{
			label: "Horaire brute médiane",
			womenValue: overrides.hourlyMedianW ?? "",
			menValue: overrides.hourlyMedianM ?? "",
		},
	];
}

describe("GapInterpretationCallout", () => {
	it("returns null when no rows have data", () => {
		const emptyRows: PayGapRow[] = [
			{ label: "Annuelle brute moyenne", womenValue: "", menValue: "" },
			{ label: "Annuelle brute médiane", womenValue: "", menValue: "" },
		];

		const { container } = render(<GapInterpretationCallout rows={emptyRows} />);

		expect(container.innerHTML).toBe("");
	});

	it("renders women disfavored title for payGap variant when women values are lower", () => {
		const rows = makeRows({
			annualMeanW: "25000",
			annualMeanM: "30000",
			annualMedianW: "24000",
			annualMedianM: "29000",
			hourlyMeanW: "12",
			hourlyMeanM: "15",
			hourlyMedianW: "11",
			hourlyMedianM: "14",
		});

		render(<GapInterpretationCallout rows={rows} variant="payGap" />);

		expect(
			screen.getByText(/Écart en défaveur des femmes/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Les femmes perçoivent en moyenne/),
		).toBeInTheDocument();
	});

	it("renders men disfavored title for payGap variant when men values are lower", () => {
		const rows = makeRows({
			annualMeanW: "35000",
			annualMeanM: "30000",
			annualMedianW: "34000",
			annualMedianM: "29000",
			hourlyMeanW: "18",
			hourlyMeanM: "15",
			hourlyMedianW: "17",
			hourlyMedianM: "14",
		});

		render(<GapInterpretationCallout rows={rows} variant="payGap" />);

		expect(
			screen.getByText(/Écart en défaveur des hommes/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Les hommes perçoivent en moyenne/),
		).toBeInTheDocument();
	});

	it("renders balanced title for payGap variant when gaps are below 5%", () => {
		// 2 rows women-lower, 2 rows men-lower => balanced direction, all gaps < 5%
		const rows = makeRows({
			annualMeanW: "30000",
			annualMeanM: "30500",
			annualMedianW: "30500",
			annualMedianM: "30000",
			hourlyMeanW: "15",
			hourlyMeanM: "15.2",
			hourlyMedianW: "15.2",
			hourlyMedianM: "15",
		});

		render(<GapInterpretationCallout rows={rows} variant="payGap" />);

		expect(
			screen.getByText(/Écart entre hommes et femmes/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Les rémunérations annuelles et médianes/),
		).toBeInTheDocument();
	});

	it("renders women disfavored title for variablePay variant", () => {
		const rows = makeRows({
			annualMeanW: "2000",
			annualMeanM: "3000",
			annualMedianW: "1800",
			annualMedianM: "2800",
			hourlyMeanW: "5",
			hourlyMeanM: "8",
			hourlyMedianW: "4",
			hourlyMedianM: "7",
		});

		render(
			<GapInterpretationCallout
				beneficiaryMen="40"
				beneficiaryWomen="20"
				maxMen={100}
				maxWomen={100}
				rows={rows}
				variant="variablePay"
			/>,
		);

		expect(
			screen.getByText(/Écart en défaveur des femmes/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/les écarts sont très importants/),
		).toBeInTheDocument();
	});

	it("uses orange accent class when any gap is >= 5%", () => {
		const rows = makeRows({
			annualMeanW: "25000",
			annualMeanM: "30000",
			annualMedianW: "24000",
			annualMedianM: "29000",
			hourlyMeanW: "12",
			hourlyMeanM: "15",
			hourlyMedianW: "11",
			hourlyMedianM: "14",
		});

		const { container } = render(
			<GapInterpretationCallout rows={rows} variant="payGap" />,
		);

		const callout = container.querySelector(".fr-callout");
		expect(callout).toHaveClass("fr-callout--orange-terre-battue");
	});

	it("uses blue accent class when all gaps are < 5%", () => {
		const rows = makeRows({
			annualMeanW: "30000",
			annualMeanM: "30500",
			annualMedianW: "30000",
			annualMedianM: "30200",
			hourlyMeanW: "15",
			hourlyMeanM: "15.2",
			hourlyMedianW: "14.8",
			hourlyMedianM: "15",
		});

		const { container } = render(
			<GapInterpretationCallout rows={rows} variant="payGap" />,
		);

		const callout = container.querySelector(".fr-callout");
		expect(callout).toHaveClass("fr-callout--blue-ecume");
	});
});
