import { describe, expect, it } from "vitest";
import { updateEmployeeCategoriesSchema, updateStep4Schema } from "../schemas";
import type { QuartileData, QuartileTuple } from "../types";

function makeTable(
	q1: QuartileData,
	q2: QuartileData,
	q3: QuartileData,
	q4: QuartileData,
): QuartileTuple {
	return [q1, q2, q3, q4];
}

const validTable = makeTable(
	{ threshold: "10000", women: 2, men: 3 },
	{ threshold: "20000", women: 4, men: 5 },
	{ threshold: "30000", women: 6, men: 7 },
	{ women: 8, men: 9 },
);

describe("updateStep4Schema", () => {
	it("accepts valid data with 3 strictly increasing thresholds and Q4 without threshold", () => {
		const result = updateStep4Schema.safeParse({
			annual: validTable,
			hourly: validTable,
		});
		expect(result.success).toBe(true);
	});

	it("rejects when a Q1-Q3 threshold is empty string", () => {
		const table = makeTable(
			{ threshold: "", women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain("Le seuil est obligatoire");
		}
	});

	it("rejects when a Q1-Q3 threshold is absent (undefined)", () => {
		const table = makeTable(
			{ women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain("Le seuil est obligatoire");
		}
	});

	it("rejects when thresholds are not strictly increasing", () => {
		const table = makeTable(
			{ threshold: "30000", women: 1, men: 1 },
			{ threshold: "25000", women: 1, men: 1 },
			{ threshold: "40000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain(
				"Les seuils doivent être strictement croissants",
			);
		}
	});

	it("rejects when two thresholds are equal", () => {
		const table = makeTable(
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain(
				"Les seuils doivent être strictement croissants",
			);
		}
	});

	it("rejects when Q4 has a threshold present", () => {
		const table = makeTable(
			{ threshold: "10000", women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ threshold: "50000", women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain("Le 4ème quartile ne doit pas avoir de seuil");
		}
	});

	it("rejects when women count is negative", () => {
		const table = makeTable(
			{ threshold: "10000", women: -1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
	});

	it("rejects when tuple has wrong length (3 elements instead of 4)", () => {
		const shortTable = [
			{ threshold: "10000", women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
		];
		const result = updateStep4Schema.safeParse({
			annual: shortTable,
			hourly: shortTable,
		});
		expect(result.success).toBe(false);
	});

	it("rejects when a Q1-Q3 threshold is non-numeric", () => {
		const table = makeTable(
			{ threshold: "abc", women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain("Le seuil est obligatoire");
		}
	});

	it("rejects when first two thresholds increase but third is lower", () => {
		const table = makeTable(
			{ threshold: "10000", women: 1, men: 1 },
			{ threshold: "30000", women: 1, men: 1 },
			{ threshold: "20000", women: 1, men: 1 },
			{ women: 1, men: 1 },
		);
		const result = updateStep4Schema.safeParse({
			annual: table,
			hourly: table,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain(
				"Les seuils doivent être strictement croissants",
			);
		}
	});
});

const PAY_FIELDS_WOMEN = {
	annualBaseWomen: "30000",
	annualVariableWomen: "2000",
	hourlyBaseWomen: "18",
	hourlyVariableWomen: "1.5",
} as const;

const PAY_FIELDS_MEN = {
	annualBaseMen: "32000",
	annualVariableMen: "2500",
	hourlyBaseMen: "19",
	hourlyVariableMen: "1.8",
} as const;

const INCOMPLETE_REMUNERATION_MESSAGE =
	"Veuillez renseigner toutes les données de rémunération avant de passer à l'étape suivante.";

function parseCategory(data: Record<string, unknown>) {
	return updateEmployeeCategoriesSchema.safeParse({
		declarationType: "initial",
		source: "dads",
		categories: [{ name: "Cadres", data }],
	});
}

describe("updateEmployeeCategoriesSchema — remuneration completeness (#3948)", () => {
	it("accepts a category with both sexes present and all 8 pay fields filled", () => {
		const result = parseCategory({
			womenCount: 2,
			menCount: 2,
			...PAY_FIELDS_WOMEN,
			...PAY_FIELDS_MEN,
		});
		expect(result.success).toBe(true);
	});

	it("accepts womenCount=0 with only the 4 men pay fields", () => {
		const result = parseCategory({
			womenCount: 0,
			menCount: 2,
			...PAY_FIELDS_MEN,
		});
		expect(result.success).toBe(true);
	});

	it("accepts menCount=0 with only the 4 women pay fields", () => {
		const result = parseCategory({
			womenCount: 2,
			menCount: 0,
			...PAY_FIELDS_WOMEN,
		});
		expect(result.success).toBe(true);
	});

	it("accepts both sexes at headcount 0 with no pay fields", () => {
		const result = parseCategory({ womenCount: 0, menCount: 0 });
		expect(result.success).toBe(true);
	});

	it("accepts omitted counts (undefined) with no pay fields — treated as 0", () => {
		const result = parseCategory({});
		expect(result.success).toBe(true);
	});

	it("rejects a category with headcounts but zero pay fields", () => {
		const result = parseCategory({ womenCount: 2, menCount: 2 });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCOMPLETE_REMUNERATION_MESSAGE,
			);
		}
	});

	it("rejects when only the women pay fields are filled but men have a headcount", () => {
		const result = parseCategory({
			womenCount: 2,
			menCount: 2,
			...PAY_FIELDS_WOMEN,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCOMPLETE_REMUNERATION_MESSAGE,
			);
		}
	});

	it("rejects when a sex with a headcount has only one of its 4 pay fields", () => {
		const result = parseCategory({
			womenCount: 2,
			menCount: 2,
			annualBaseWomen: "30000",
			...PAY_FIELDS_MEN,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCOMPLETE_REMUNERATION_MESSAGE,
			);
		}
	});

	it("rejects an empty pay field (empty string counts as missing)", () => {
		const result = parseCategory({
			womenCount: 2,
			menCount: 0,
			...PAY_FIELDS_WOMEN,
			annualBaseWomen: "",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCOMPLETE_REMUNERATION_MESSAGE,
			);
		}
	});

	it("rejects a single-headcount sex with no pay fields (womenCount=1, menCount=0)", () => {
		const result = parseCategory({ womenCount: 1, menCount: 0 });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCOMPLETE_REMUNERATION_MESSAGE,
			);
		}
	});
});
