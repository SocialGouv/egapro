import { describe, expect, it } from "vitest";

import { updateEmployeeCategoriesSchema } from "~/modules/declaration-remuneration/schemas";
import { type EmployeeCategory, toSubmitData } from "../categorySerializer";

const PAY_FIELDS = [
	"annualBaseWomen",
	"annualBaseMen",
	"annualVariableWomen",
	"annualVariableMen",
	"hourlyBaseWomen",
	"hourlyBaseMen",
	"hourlyVariableWomen",
	"hourlyVariableMen",
] as const satisfies readonly (keyof EmployeeCategory)[];

function category(overrides: Partial<EmployeeCategory> = {}): EmployeeCategory {
	return {
		id: 42,
		name: "Cadres",
		womenCount: "3",
		menCount: "2",
		hourlyWomenCount: "3",
		hourlyMenCount: "2",
		annualBaseWomen: "30000",
		annualBaseMen: "32000",
		annualVariableWomen: "5000",
		annualVariableMen: "6000",
		hourlyBaseWomen: "18",
		hourlyBaseMen: "19",
		hourlyVariableWomen: "3",
		hourlyVariableMen: "4",
		...overrides,
	};
}

describe("toSubmitData", () => {
	it("omits all pay fields for a category with one explicit zero", () => {
		const input = category({ hourlyWomenCount: "0" });
		const before = structuredClone(input);

		const result = toSubmitData([input], "accord-entreprise");
		const data = result.categories[0]?.data;

		expect(data).toMatchObject({
			womenCount: 3,
			menCount: 2,
			hourlyWomenCount: 0,
			hourlyMenCount: 2,
		});
		for (const field of PAY_FIELDS) expect(data?.[field]).toBeUndefined();
		expect(JSON.stringify(result)).not.toContain("annualBaseWomen");
		expect(input).toEqual(before);
	});

	it("keeps pay fields for an applicable category", () => {
		const result = toSubmitData([category()], "accord-entreprise");

		expect(result.categories[0]?.data).toMatchObject({
			annualBaseWomen: "30000",
			annualBaseMen: "32000",
			hourlyBaseWomen: "18",
			hourlyBaseMen: "19",
		});
	});

	it("produces a mixed zero/positive payload accepted by the server schema", () => {
		const result = toSubmitData(
			[category({ womenCount: "0", menCount: "5" })],
			"accord-entreprise",
		);

		expect(
			updateEmployeeCategoriesSchema.safeParse({
				declarationType: "initial",
				...result,
			}).success,
		).toBe(true);
	});
});
