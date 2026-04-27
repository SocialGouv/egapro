import { describe, expect, it } from "vitest";
import {
	INDICATOR_A_LABELS,
	INDICATOR_B_LABELS,
	INDICATOR_C_LABELS,
	INDICATOR_D_LABELS,
	INDICATOR_E_LABELS,
	INDICATOR_F_ANNUAL_MEN_LABELS,
	INDICATOR_F_ANNUAL_THRESHOLD_LABELS,
	INDICATOR_F_ANNUAL_WOMEN_LABELS,
	INDICATOR_F_HOURLY_MEN_LABELS,
	INDICATOR_F_HOURLY_THRESHOLD_LABELS,
	INDICATOR_F_HOURLY_WOMEN_LABELS,
} from "~/modules/export";
import { SCHEMA_COLUMN_COMMENTS } from "../schema-comments";

const declarationComments = SCHEMA_COLUMN_COMMENTS.declaration ?? {};

describe("SCHEMA_COLUMN_COMMENTS — indicators A–F", () => {
	it("annotates all indicator A columns", () => {
		expect(declarationComments.indicator_a_annual_women).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_A_LABELS.annualWomen}`,
		);
		expect(declarationComments.indicator_a_annual_men).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_A_LABELS.annualMen}`,
		);
		expect(declarationComments.indicator_a_hourly_women).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_A_LABELS.hourlyWomen}`,
		);
		expect(declarationComments.indicator_a_hourly_men).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_A_LABELS.hourlyMen}`,
		);
	});

	it("annotates all indicator B columns", () => {
		expect(declarationComments.indicator_b_annual_women).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_B_LABELS.annualWomen}`,
		);
		expect(declarationComments.indicator_b_annual_men).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_B_LABELS.annualMen}`,
		);
		expect(declarationComments.indicator_b_hourly_women).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_B_LABELS.hourlyWomen}`,
		);
		expect(declarationComments.indicator_b_hourly_men).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_B_LABELS.hourlyMen}`,
		);
	});

	it("annotates all indicator C columns", () => {
		expect(declarationComments.indicator_c_annual_women).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_C_LABELS.annualWomen}`,
		);
		expect(declarationComments.indicator_c_annual_men).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_C_LABELS.annualMen}`,
		);
		expect(declarationComments.indicator_c_hourly_women).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_C_LABELS.hourlyWomen}`,
		);
		expect(declarationComments.indicator_c_hourly_men).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_C_LABELS.hourlyMen}`,
		);
	});

	it("annotates all indicator D columns", () => {
		expect(declarationComments.indicator_d_annual_women).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_D_LABELS.annualWomen}`,
		);
		expect(declarationComments.indicator_d_annual_men).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_D_LABELS.annualMen}`,
		);
		expect(declarationComments.indicator_d_hourly_women).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_D_LABELS.hourlyWomen}`,
		);
		expect(declarationComments.indicator_d_hourly_men).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_D_LABELS.hourlyMen}`,
		);
	});

	it("annotates all indicator E columns", () => {
		expect(declarationComments.indicator_e_women).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_E_LABELS.women}`,
		);
		expect(declarationComments.indicator_e_men).toBe(
			`GIP-MDS | SUIT: ${INDICATOR_E_LABELS.men}`,
		);
	});

	it("annotates all indicator F annual threshold columns", () => {
		for (let i = 0; i < 4; i++) {
			expect(declarationComments[`indicator_f_annual_threshold${i + 1}`]).toBe(
				`GIP-MDS | SUIT: ${INDICATOR_F_ANNUAL_THRESHOLD_LABELS[i]}`,
			);
		}
	});

	it("annotates all indicator F annual women proportion columns", () => {
		for (let i = 0; i < 4; i++) {
			expect(declarationComments[`indicator_f_annual_women${i + 1}`]).toBe(
				`GIP-MDS | SUIT: ${INDICATOR_F_ANNUAL_WOMEN_LABELS[i]}`,
			);
		}
	});

	it("annotates all indicator F annual men proportion columns", () => {
		for (let i = 0; i < 4; i++) {
			expect(declarationComments[`indicator_f_annual_men${i + 1}`]).toBe(
				`GIP-MDS | SUIT: ${INDICATOR_F_ANNUAL_MEN_LABELS[i]}`,
			);
		}
	});

	it("annotates all indicator F hourly threshold columns", () => {
		for (let i = 0; i < 4; i++) {
			expect(declarationComments[`indicator_f_hourly_threshold${i + 1}`]).toBe(
				`GIP-MDS | SUIT: ${INDICATOR_F_HOURLY_THRESHOLD_LABELS[i]}`,
			);
		}
	});

	it("annotates all indicator F hourly women proportion columns", () => {
		for (let i = 0; i < 4; i++) {
			expect(declarationComments[`indicator_f_hourly_women${i + 1}`]).toBe(
				`GIP-MDS | SUIT: ${INDICATOR_F_HOURLY_WOMEN_LABELS[i]}`,
			);
		}
	});

	it("annotates all indicator F hourly men proportion columns", () => {
		for (let i = 0; i < 4; i++) {
			expect(declarationComments[`indicator_f_hourly_men${i + 1}`]).toBe(
				`GIP-MDS | SUIT: ${INDICATOR_F_HOURLY_MEN_LABELS[i]}`,
			);
		}
	});

	it("has every SUIT label appearing exactly once across all A–F entries (S4)", () => {
		const PREFIX = "GIP-MDS | SUIT: ";
		const allLabels = Object.values(declarationComments)
			.filter((comment) => comment.startsWith(PREFIX))
			.map((comment) => comment.slice(PREFIX.length));
		const suitLabels = [
			...Object.values(INDICATOR_A_LABELS),
			...Object.values(INDICATOR_B_LABELS),
			...Object.values(INDICATOR_C_LABELS),
			...Object.values(INDICATOR_D_LABELS),
			...Object.values(INDICATOR_E_LABELS),
			...INDICATOR_F_ANNUAL_THRESHOLD_LABELS,
			...INDICATOR_F_ANNUAL_WOMEN_LABELS,
			...INDICATOR_F_ANNUAL_MEN_LABELS,
			...INDICATOR_F_HOURLY_THRESHOLD_LABELS,
			...INDICATOR_F_HOURLY_WOMEN_LABELS,
			...INDICATOR_F_HOURLY_MEN_LABELS,
		];
		expect(allLabels).toHaveLength(suitLabels.length);
		for (const label of suitLabels) {
			expect(allLabels.filter((l) => l === label)).toHaveLength(1);
		}
	});
});
