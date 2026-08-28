import { describe, expect, it } from "vitest";
import {
	createDevStep5Categories,
	DEV_STEP1_ROWS,
	DEV_STEP2_ROWS,
	DEV_STEP3_BENEFICIARY_MEN,
	DEV_STEP3_BENEFICIARY_WOMEN,
	DEV_STEP3_ROWS,
	DEV_STEP4_ANNUAL,
	DEV_STEP4_HOURLY,
	DEV_STEP5_SOURCE,
} from "../devFillData";

describe("devFillData", () => {
	it("Step1 has one workforce row per pay basis, each with 120 women and 130 men", () => {
		expect(DEV_STEP1_ROWS).toHaveLength(2);
		for (const row of DEV_STEP1_ROWS) {
			expect(row.women).toBe(120);
			expect(row.men).toBe(130);
		}
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

	it("Step5 source is accord-entreprise", () => {
		expect(DEV_STEP5_SOURCE).toBe("accord-entreprise");
	});

	const totals = (
		women: number,
		men: number,
		hourlyWomen: number,
		hourlyMen: number,
	) => ({
		annual: { women, men },
		hourly: { women: hourlyWomen, men: hourlyMen },
	});

	const sumOf = (
		categories: ReturnType<typeof createDevStep5Categories>,
		field: "womenCount" | "menCount" | "hourlyWomenCount" | "hourlyMenCount",
	) => categories.reduce((sum, c) => sum + Number(c[field]), 0);

	it("createDevStep5Categories returns 4 categories with sequential IDs", () => {
		let counter = 0;
		const nextId = () => ++counter;
		const categories = createDevStep5Categories(
			nextId,
			totals(120, 130, 120, 130),
		);

		expect(categories).toHaveLength(4);
		expect(categories[0]?.id).toBe(1);
		expect(categories[1]?.id).toBe(2);
		expect(categories[2]?.id).toBe(3);
		expect(categories[3]?.id).toBe(4);
	});

	it("createDevStep5Categories totals match given workforce", () => {
		const categories = createDevStep5Categories(
			() => 0,
			totals(120, 130, 120, 130),
		);

		expect(sumOf(categories, "womenCount")).toBe(120);
		expect(sumOf(categories, "menCount")).toBe(130);
	});

	it("createDevStep5Categories distributes the hourly workforce on its own row", () => {
		const categories = createDevStep5Categories(
			() => 0,
			totals(120, 130, 40, 60),
		);

		expect(sumOf(categories, "hourlyWomenCount")).toBe(40);
		expect(sumOf(categories, "hourlyMenCount")).toBe(60);
		expect(sumOf(categories, "womenCount")).toBe(120);
		expect(sumOf(categories, "menCount")).toBe(130);
	});

	it("createDevStep5Categories distributes custom workforce totals correctly", () => {
		const categories = createDevStep5Categories(
			() => 0,
			totals(200, 250, 200, 250),
		);

		expect(sumOf(categories, "womenCount")).toBe(200);
		expect(sumOf(categories, "menCount")).toBe(250);
	});

	it("createDevStep5Categories distributes small totals", () => {
		const categories = createDevStep5Categories(() => 0, totals(4, 4, 2, 1));

		expect(sumOf(categories, "womenCount")).toBe(4);
		expect(sumOf(categories, "menCount")).toBe(4);
		expect(sumOf(categories, "hourlyWomenCount")).toBe(2);
		expect(sumOf(categories, "hourlyMenCount")).toBe(1);
	});
});
