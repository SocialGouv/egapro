import { describe, expect, it } from "vitest";

import { updateEmployeeCategoriesSchema } from "~/modules/declaration-remuneration/schemas";
import {
	type EmployeeCategory,
	toSubmitData,
	withoutPayValuesWhenNotApplicable,
} from "../categorySerializer";

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
	it("omits all pay fields when one sex has 0 on both workforce rows", () => {
		const input = category({ womenCount: "0", hourlyWomenCount: "0" });
		const before = structuredClone(input);

		const result = toSubmitData([input], "accord-entreprise");
		const data = result.categories[0]?.data;

		expect(data).toMatchObject({
			womenCount: 0,
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

	it("keeps pay for an isolated zero and produces a server-valid payload", () => {
		const result = toSubmitData(
			[category({ womenCount: "0", menCount: "5" })],
			"accord-entreprise",
		);
		expect(result.categories[0]?.data.annualBaseWomen).toBe("30000");

		expect(
			updateEmployeeCategoriesSchema.safeParse({
				declarationType: "initial",
				...result,
			}).success,
		).toBe(true);
	});
});

describe("withoutPayValuesWhenNotApplicable", () => {
	it("clears all pay fields without mutating a non-applicable category", () => {
		const input = category({ menCount: "0", hourlyMenCount: "0" });
		const before = structuredClone(input);

		const result = withoutPayValuesWhenNotApplicable(input);

		for (const field of PAY_FIELDS) expect(result[field]).toBe("");
		expect(result).toMatchObject({
			id: 42,
			name: "Cadres",
			menCount: "0",
			hourlyMenCount: "0",
		});
		expect(input).toEqual(before);
	});

	it("returns an applicable category unchanged for isolated and crossed zeros", () => {
		const isolated = category({ womenCount: "0" });
		const crossed = category({ womenCount: "0", hourlyMenCount: "0" });

		expect(withoutPayValuesWhenNotApplicable(isolated)).toBe(isolated);
		expect(withoutPayValuesWhenNotApplicable(crossed)).toBe(crossed);
	});
});
