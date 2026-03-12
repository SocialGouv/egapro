import { describe, expect, it } from "vitest";
import {
	createDevStep5Categories,
	DEV_STEP1_CATEGORIES,
	DEV_STEP2_ROWS,
	DEV_STEP3_BENEFICIARY_MEN,
	DEV_STEP3_BENEFICIARY_WOMEN,
	DEV_STEP3_ROWS,
	DEV_STEP4_ANNUAL,
	DEV_STEP4_HOURLY,
	DEV_STEP5_SOURCE,
} from "../devFillData";

describe("devFillData", () => {
	it("Step1 has 1 category with 120 women and 130 men", () => {
		expect(DEV_STEP1_CATEGORIES).toHaveLength(1);
		expect(DEV_STEP1_CATEGORIES[0]?.women).toBe(120);
		expect(DEV_STEP1_CATEGORIES[0]?.men).toBe(130);
	});

	it("Step2 has 4 pay gap rows", () => {
		expect(DEV_STEP2_ROWS).toHaveLength(4);
		for (const row of DEV_STEP2_ROWS) {
			expect(row.womenValue).toBeTruthy();
			expect(row.menValue).toBeTruthy();
		}
	});

	it("Step3 has 4 variable pay rows and beneficiary counts", () => {
		expect(DEV_STEP3_ROWS).toHaveLength(4);
		expect(DEV_STEP3_BENEFICIARY_WOMEN).toBe("95");
		expect(DEV_STEP3_BENEFICIARY_MEN).toBe("110");
	});

	it("Step4 has 4 annual and 4 hourly quartiles", () => {
		expect(DEV_STEP4_ANNUAL).toHaveLength(4);
		expect(DEV_STEP4_HOURLY).toHaveLength(4);
	});

	it("Step5 source is convention-collective", () => {
		expect(DEV_STEP5_SOURCE).toBe("convention-collective");
	});

	it("createDevStep5Categories returns 4 categories with sequential IDs", () => {
		let counter = 0;
		const nextId = () => ++counter;
		const categories = createDevStep5Categories(nextId);

		expect(categories).toHaveLength(4);
		expect(categories[0]?.id).toBe(1);
		expect(categories[1]?.id).toBe(2);
		expect(categories[2]?.id).toBe(3);
		expect(categories[3]?.id).toBe(4);
	});

	it("createDevStep5Categories totals match Step1 workforce", () => {
		const categories = createDevStep5Categories(() => 0);
		const totalWomen = categories.reduce(
			(sum, c) => sum + Number(c.womenCount),
			0,
		);
		const totalMen = categories.reduce((sum, c) => sum + Number(c.menCount), 0);

		expect(totalWomen).toBe(DEV_STEP1_CATEGORIES[0]?.women);
		expect(totalMen).toBe(DEV_STEP1_CATEGORIES[0]?.men);
	});
});
