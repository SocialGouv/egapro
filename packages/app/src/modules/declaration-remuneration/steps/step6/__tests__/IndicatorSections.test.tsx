import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
	Step2Data,
	Step3Data,
	Step4Data,
} from "~/modules/declaration-remuneration/types";
import { IndicatorSections } from "../IndicatorSections";

const emptyStep2Data = (): Step2Data => ({
	indicatorAAnnualWomen: "",
	indicatorAAnnualMen: "",
	indicatorAHourlyWomen: "",
	indicatorAHourlyMen: "",
	indicatorCAnnualWomen: "",
	indicatorCAnnualMen: "",
	indicatorCHourlyWomen: "",
	indicatorCHourlyMen: "",
});

const emptyStep4Data = (): Step4Data => ({
	annual: [{}, {}, {}, {}],
	hourly: [{}, {}, {}, {}],
});

// All four gap fields are populated so GapBadge never renders "-"; the only "-"
// cells left in the card are the two proportion values under test.
const step3WithProportion = (
	indicatorEWomen: string,
	indicatorEMen: string,
): Step3Data => ({
	indicatorBAnnualWomen: "95",
	indicatorBAnnualMen: "100",
	indicatorBHourlyWomen: "95",
	indicatorBHourlyMen: "100",
	indicatorDAnnualWomen: "95",
	indicatorDAnnualMen: "100",
	indicatorDHourlyWomen: "95",
	indicatorDHourlyMen: "100",
	indicatorEWomen,
	indicatorEMen,
});

describe("IndicatorSections", () => {
	it("renders variable pay proportion as a share of the workforce total, not the raw beneficiary count", () => {
		render(
			<IndicatorSections
				step2Data={emptyStep2Data()}
				step3Data={step3WithProportion("95", "80")}
				step4Data={emptyStep4Data()}
				step5Categories={[]}
				totalMen={100}
				totalWomen={200}
			/>,
		);

		expect(screen.getByText("47,5 %")).toBeInTheDocument();
		expect(screen.getByText("80,0 %")).toBeInTheDocument();
		expect(screen.queryByText("95 %")).not.toBeInTheDocument();
		expect(screen.queryByText("110 %")).not.toBeInTheDocument();
	});

	it("renders '-' for the proportion when the workforce total is zero", () => {
		render(
			<IndicatorSections
				step2Data={emptyStep2Data()}
				step3Data={step3WithProportion("95", "80")}
				step4Data={emptyStep4Data()}
				step5Categories={[]}
				totalMen={0}
				totalWomen={0}
			/>,
		);

		expect(screen.getByText("Proportion")).toBeInTheDocument();
		expect(screen.getAllByText("-")).toHaveLength(2);
	});

	it("renders '-' for the proportion when the workforce total is missing", () => {
		render(
			<IndicatorSections
				step2Data={emptyStep2Data()}
				step3Data={step3WithProportion("95", "80")}
				step4Data={emptyStep4Data()}
				step5Categories={[]}
			/>,
		);

		expect(screen.getAllByText("-")).toHaveLength(2);
	});
});
