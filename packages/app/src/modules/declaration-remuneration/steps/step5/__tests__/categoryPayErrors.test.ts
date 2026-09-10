import { describe, expect, it } from "vitest";

import { collectCategoryPayErrors } from "../categoryPayErrors";
import type { EmployeeCategory } from "../categorySerializer";

function category(overrides: Partial<EmployeeCategory> = {}): EmployeeCategory {
	return {
		id: 0,
		name: "Cadres",
		womenCount: "1",
		menCount: "1",
		hourlyWomenCount: "1",
		hourlyMenCount: "1",
		annualBaseWomen: "",
		annualBaseMen: "",
		annualVariableWomen: "",
		annualVariableMen: "",
		hourlyBaseWomen: "",
		hourlyBaseMen: "",
		hourlyVariableWomen: "",
		hourlyVariableMen: "",
		...overrides,
	};
}

describe("collectCategoryPayErrors", () => {
	it("does not validate pay fields for a non-calculable category", () => {
		expect(
			collectCategoryPayErrors([
				category({
					womenCount: "0",
					hourlyWomenCount: "0",
					annualBaseWomen: "30000",
					annualBaseMen: "32000",
					annualVariableWomen: "5000",
					annualVariableMen: "6000",
					hourlyBaseWomen: "18",
					hourlyBaseMen: "19",
					hourlyVariableWomen: "3",
					hourlyVariableMen: "4",
				}),
			]),
		).toEqual([]);
	});

	it("keeps completeness validation for an applicable category", () => {
		expect(collectCategoryPayErrors([category()])).toHaveLength(8);
	});
});
