import { describe, expect, it } from "vitest";
import {
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_NAME_MAX_LENGTH_MESSAGE,
	categoryFormSchema,
	PAY_FIELDS_MEN,
	PAY_FIELDS_WOMEN,
	updateEmployeeCategoriesSchema,
	updateStep4Schema,
} from "../schemas";
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

function buildPayFieldValues(
	fields: readonly string[],
): Record<string, string> {
	return Object.fromEntries(fields.map((field, i) => [field, String(i + 1)]));
}

const WOMEN_PAY_VALUES = buildPayFieldValues(PAY_FIELDS_WOMEN);
const MEN_PAY_VALUES = buildPayFieldValues(PAY_FIELDS_MEN);

const INCOMPLETE_REMUNERATION_MESSAGE =
	"Veuillez renseigner toutes les données de rémunération avant de passer à l'étape suivante.";

const INCONSISTENT_REMUNERATION_MESSAGE =
	"Une catégorie d'emplois dont un effectif est à 0 ne peut pas déclarer de rémunération.";

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
			...WOMEN_PAY_VALUES,
			...MEN_PAY_VALUES,
		});
		expect(result.success).toBe(true);
	});

	it("rejects womenCount=0 even when only the 4 men pay fields are filled (#3678)", () => {
		const result = parseCategory({
			womenCount: 0,
			menCount: 2,
			...MEN_PAY_VALUES,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCONSISTENT_REMUNERATION_MESSAGE,
			);
		}
	});

	it("rejects menCount=0 even when only the 4 women pay fields are filled (#3678)", () => {
		const result = parseCategory({
			womenCount: 2,
			menCount: 0,
			...WOMEN_PAY_VALUES,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCONSISTENT_REMUNERATION_MESSAGE,
			);
		}
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
			...WOMEN_PAY_VALUES,
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
			annualBaseWomen: WOMEN_PAY_VALUES.annualBaseWomen,
			...MEN_PAY_VALUES,
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
			...WOMEN_PAY_VALUES,
			annualBaseWomen: "",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCOMPLETE_REMUNERATION_MESSAGE,
			);
		}
	});

	it("requires only the annual pay fields when the hourly headcounts are absent (#4254)", () => {
		const result = parseCategory({
			womenCount: 2,
			menCount: 2,
			annualBaseWomen: "30000",
			annualVariableWomen: "5000",
			annualBaseMen: "32000",
			annualVariableMen: "6000",
		});
		expect(result.success).toBe(true);
	});

	it("requires only the hourly pay fields when the annual headcounts are absent (#4254)", () => {
		const result = parseCategory({
			hourlyWomenCount: 2,
			hourlyMenCount: 2,
			hourlyBaseWomen: "18.5",
			hourlyVariableWomen: "3.0",
			hourlyBaseMen: "19.0",
			hourlyVariableMen: "3.5",
		});
		expect(result.success).toBe(true);
	});

	it("rejects an hourly headcount whose hourly pay fields are missing, even with the annual ones filled (#4254)", () => {
		const result = parseCategory({
			womenCount: 2,
			menCount: 2,
			hourlyWomenCount: 2,
			hourlyMenCount: 2,
			annualBaseWomen: "30000",
			annualVariableWomen: "5000",
			annualBaseMen: "32000",
			annualVariableMen: "6000",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCOMPLETE_REMUNERATION_MESSAGE,
			);
		}
	});

	it("rejects a headcount of exactly 1 with no pay fields (womenCount=1, menCount=1)", () => {
		const result = parseCategory({ womenCount: 1, menCount: 1 });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCOMPLETE_REMUNERATION_MESSAGE,
			);
		}
	});
});

describe("updateEmployeeCategoriesSchema — pay of a category at 0 (#3678)", () => {
	it("rejects a pay amount facing an annual headcount at 0", () => {
		const result = parseCategory({
			womenCount: 3,
			menCount: 0,
			annualBaseWomen: "1000",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCONSISTENT_REMUNERATION_MESSAGE,
			);
		}
	});

	it("rejects a pay amount when the 0 sits on the other basis", () => {
		const result = parseCategory({
			womenCount: 3,
			hourlyWomenCount: 0,
			annualBaseWomen: "1000",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCONSISTENT_REMUNERATION_MESSAGE,
			);
		}
	});

	it("accepts an annual headcount at 0 with no pay amount at all", () => {
		expect(parseCategory({ womenCount: 3, menCount: 0 }).success).toBe(true);
	});

	it("accepts an hourly headcount at 0 with no pay amount at all", () => {
		expect(parseCategory({ womenCount: 3, hourlyWomenCount: 0 }).success).toBe(
			true,
		);
	});

	it("still rejects a category without any 0 that declares no pay at all", () => {
		const result = parseCategory({ womenCount: 3 });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCOMPLETE_REMUNERATION_MESSAGE,
			);
		}
	});

	it("accepts an entirely empty category", () => {
		expect(parseCategory({}).success).toBe(true);
	});
});

const NAME_AT_MAX = "a".repeat(CATEGORY_NAME_MAX_LENGTH);
const NAME_OVER_MAX = "a".repeat(CATEGORY_NAME_MAX_LENGTH + 1);

function parseCategoryWithName(name: string) {
	return updateEmployeeCategoriesSchema.safeParse({
		declarationType: "initial",
		source: "dads",
		categories: [
			{
				name,
				data: {
					womenCount: 2,
					menCount: 2,
					...WOMEN_PAY_VALUES,
					...MEN_PAY_VALUES,
				},
			},
		],
	});
}

function parseCategoryForm(name: string) {
	return categoryFormSchema.safeParse({
		source: "dads",
		categories: [
			{
				name,
				womenCount: "",
				menCount: "",
				hourlyWomenCount: "",
				hourlyMenCount: "",
				annualBaseWomen: "",
				annualBaseMen: "",
				annualVariableWomen: "",
				annualVariableMen: "",
				hourlyBaseWomen: "",
				hourlyBaseMen: "",
				hourlyVariableWomen: "",
				hourlyVariableMen: "",
			},
		],
	});
}

describe("category name length cap (#3943)", () => {
	it("updateEmployeeCategoriesSchema accepts a name of exactly 255 characters", () => {
		const result = parseCategoryWithName(NAME_AT_MAX);
		expect(result.success).toBe(true);
	});

	it("updateEmployeeCategoriesSchema rejects a name of 256 characters with the max-length message", () => {
		const result = parseCategoryWithName(NAME_OVER_MAX);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				CATEGORY_NAME_MAX_LENGTH_MESSAGE,
			);
		}
	});

	it("categoryFormSchema accepts a name of exactly 255 characters", () => {
		const result = parseCategoryForm(NAME_AT_MAX);
		expect(result.success).toBe(true);
	});

	it("categoryFormSchema rejects a name of 256 characters with the max-length message", () => {
		const result = parseCategoryForm(NAME_OVER_MAX);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				CATEGORY_NAME_MAX_LENGTH_MESSAGE,
			);
		}
	});
});
