import { describe, expect, it } from "vitest";
import { PAY_FIELDS_MEN, PAY_FIELDS_WOMEN } from "~/modules/domain";
import {
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_NAME_MAX_LENGTH_MESSAGE,
	categoryCorrectionFormSchema,
	categoryFormSchema,
	compliancePathFormSchema,
	updateEmployeeCategoriesSchema,
	updateStep1Schema,
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

describe("updateStep1Schema", () => {
	it.each([
		[
			{ totalWomen: 0, totalMen: 0, hourlyWomen: 10, hourlyMen: 20 },
			"totalWomen",
		],
		[
			{ totalWomen: 10, totalMen: 20, hourlyWomen: 0, hourlyMen: 0 },
			"hourlyWomen",
		],
		[{ totalWomen: 0, totalMen: 0, hourlyWomen: 0, hourlyMen: 0 }, "both rows"],
	])("rejects a workforce row with no employees (%s)", (values, field) => {
		const result = updateStep1Schema.safeParse(values);
		expect(result.success).toBe(false);
		if (!result.success) {
			if (field === "both rows") {
				expect(result.error.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ path: ["totalWomen"] }),
						expect.objectContaining({ path: ["hourlyWomen"] }),
					]),
				);
			} else {
				expect(result.error.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							path: [field],
							message: expect.stringContaining("doit être supérieur à 0"),
						}),
					]),
				);
			}
		}
	});

	it.each([
		{ totalWomen: 0, totalMen: 20, hourlyWomen: 10, hourlyMen: 0 },
		{ totalWomen: 10, totalMen: 0, hourlyWomen: 0, hourlyMen: 20 },
	])("accepts zero for one sex in each row (%s)", (values) => {
		expect(updateStep1Schema.safeParse(values).success).toBe(true);
	});
});

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
	"Une base de rémunération sans femmes ou sans hommes ne peut pas être déclarée.";

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

	it("accepts a zero annual headcount without annual pay fields (#4894)", () => {
		const result = parseCategory({
			womenCount: 0,
			menCount: 2,
		});
		expect(result.success).toBe(true);
	});

	it("accepts a zero hourly headcount without hourly pay fields (#4894)", () => {
		const result = parseCategory({
			hourlyWomenCount: 2,
			hourlyMenCount: 0,
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

	it("requires no hourly pay fields when either hourly headcount is 0 (#4894)", () => {
		const result = parseCategory({
			womenCount: 2,
			menCount: 2,
			hourlyWomenCount: 0,
			hourlyMenCount: 0,
			annualBaseWomen: "30000",
			annualVariableWomen: "5000",
			annualBaseMen: "32000",
			annualVariableMen: "6000",
		});
		expect(result.success).toBe(true);
	});

	it("requires no annual pay fields when either annual headcount is 0 (#4894)", () => {
		const result = parseCategory({
			womenCount: 0,
			menCount: 2,
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
	it("rejects pay when women are absent from both workforce rows", () => {
		const result = parseCategory({
			womenCount: 0,
			menCount: 3,
			hourlyWomenCount: 0,
			hourlyMenCount: 3,
			annualBaseMen: "1000",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCONSISTENT_REMUNERATION_MESSAGE,
			);
		}
	});

	it("rejects pay when men are absent from both workforce rows", () => {
		const result = parseCategory({
			womenCount: 3,
			menCount: 0,
			hourlyWomenCount: 3,
			hourlyMenCount: 0,
			annualBaseWomen: "1000",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				INCONSISTENT_REMUNERATION_MESSAGE,
			);
		}
	});

	it("does not require pay for the other sex when a basis has a zero", () => {
		expect(
			parseCategory({
				womenCount: 3,
				menCount: 0,
			}).success,
		).toBe(true);
	});

	it("accepts crossed zeros without pay fields for either inapplicable basis", () => {
		expect(
			parseCategory({
				womenCount: 0,
				menCount: 3,
				hourlyWomenCount: 3,
				hourlyMenCount: 0,
			}).success,
		).toBe(true);
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

function parseCategoryWithName(
	name: string,
	declarationType: "initial" | "correction" = "initial",
) {
	return updateEmployeeCategoriesSchema.safeParse({
		declarationType,
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

function parseCategoryForm(name: string, correction = false) {
	return (
		correction ? categoryCorrectionFormSchema : categoryFormSchema
	).safeParse({
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
	it("updateEmployeeCategoriesSchema accepts a name of exactly 250 characters", () => {
		const result = parseCategoryWithName(NAME_AT_MAX);
		expect(result.success).toBe(true);
	});

	it("updateEmployeeCategoriesSchema rejects a name of 251 characters with the max-length message", () => {
		const result = parseCategoryWithName(NAME_OVER_MAX);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				CATEGORY_NAME_MAX_LENGTH_MESSAGE,
			);
		}
	});

	it("categoryFormSchema accepts a name of exactly 250 characters", () => {
		const result = parseCategoryForm(NAME_AT_MAX);
		expect(result.success).toBe(true);
	});

	it("categoryFormSchema rejects a name of 251 characters with the max-length message", () => {
		const result = parseCategoryForm(NAME_OVER_MAX);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain(
				CATEGORY_NAME_MAX_LENGTH_MESSAGE,
			);
		}
	});

	it("accepts historical names up to 255 characters in a correction", () => {
		for (const length of [251, 255]) {
			expect(
				parseCategoryWithName("a".repeat(length), "correction").success,
			).toBe(true);
			expect(parseCategoryForm("a".repeat(length), true).success).toBe(true);
		}
	});

	it("rejects a correction name beyond the persisted 255-character limit", () => {
		expect(parseCategoryWithName("a".repeat(256), "correction").success).toBe(
			false,
		);
		expect(parseCategoryForm("a".repeat(256), true).success).toBe(false);
	});
});

describe("compliancePathFormSchema", () => {
	it("accepts a qualification without a path yet", () => {
		expect(
			compliancePathFormSchema.safeParse({ gapJustification: "partial" })
				.success,
		).toBe(true);
	});

	it("accepts a qualification with its path", () => {
		expect(
			compliancePathFormSchema.safeParse({
				gapJustification: "none",
				path: "corrective_action",
			}).success,
		).toBe(true);
	});

	it("requires the qualification", () => {
		expect(
			compliancePathFormSchema.safeParse({ path: "joint_evaluation" }).success,
		).toBe(false);
	});

	it("rejects an unknown qualification or path", () => {
		expect(
			compliancePathFormSchema.safeParse({ gapJustification: "most" }).success,
		).toBe(false);
		expect(
			compliancePathFormSchema.safeParse({
				gapJustification: "all",
				path: "retired_path",
			}).success,
		).toBe(false);
	});
});
