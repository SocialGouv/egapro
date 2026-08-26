import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PublicDeclarationDTO } from "~/modules/public-api";
import { IndicatorTables } from "./IndicatorTables";

const declaration = {
	year: 2026,
	globalAnnualMeanGap: 0.08,
	globalHourlyMeanGap: 0.055,
	globalAnnualMedianGap: 0.07,
	globalHourlyMedianGap: 0.05,
	variableAnnualMeanGap: 0.1,
	variableHourlyMeanGap: 0.07,
	variableAnnualMedianGap: 0.09,
	variableHourlyMedianGap: 0.06,
	variableProportionWomen: 0.667,
	variableProportionMen: 0.571,
	annualQuartile1ProportionWomen: 56,
	annualQuartile1ProportionMen: 44,
	annualQuartile2ProportionWomen: 52,
	annualQuartile2ProportionMen: 48,
	annualQuartile3ProportionWomen: 47,
	annualQuartile3ProportionMen: 53,
	annualQuartile4ProportionWomen: 41,
	annualQuartile4ProportionMen: 59,
	hourlyQuartile1ProportionWomen: 55,
	hourlyQuartile1ProportionMen: 45,
	hourlyQuartile2ProportionWomen: 51,
	hourlyQuartile2ProportionMen: 49,
	hourlyQuartile3ProportionWomen: 46,
	hourlyQuartile3ProportionMen: 54,
	hourlyQuartile4ProportionWomen: 40,
	hourlyQuartile4ProportionMen: 60,
} as PublicDeclarationDTO;

describe("IndicatorTables", () => {
	it("renders stored quartile percentages without multiplying them twice", () => {
		render(<IndicatorTables declaration={declaration} />);

		expect(screen.getByText("56 %")).toBeInTheDocument();
		expect(screen.queryByText("5 600 %")).not.toBeInTheDocument();
	});
});
