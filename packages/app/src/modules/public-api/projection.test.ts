import { describe, expect, it } from "vitest";
import {
	isCompanyDiffusible,
	type PublicCompanySource,
	type PublicDeclarationSource,
	toPublicDeclaration,
} from "./projection";
import { publicDeclarationDTOSchema, publicSearchInputSchema } from "./schemas";

const declarationFixture: PublicDeclarationSource = {
	year: 2024,
	totalWomen: 120,
	totalMen: 80,
	globalAnnualMeanGap: "0.1234",
	globalAnnualMedianGap: "0.1000",
	globalHourlyMeanGap: "0.0850",
	globalHourlyMedianGap: "0.0725",
	variableAnnualMeanGap: "0.0550",
	variableAnnualMedianGap: "0.0410",
	variableHourlyMeanGap: "0.0330",
	variableHourlyMedianGap: "0.0220",
	// Indicator E proportions are 0..1 per-sex coverage rates, not percentages,
	// and they do NOT sum to 1 (unlike the quartile proportions below).
	variableProportionWomen: "0.5625",
	variableProportionMen: "0.6000",
	annualQuartile1ProportionWomen: "60.0000",
	annualQuartile2ProportionWomen: "55.0000",
	annualQuartile3ProportionWomen: "50.0000",
	annualQuartile4ProportionWomen: "40.0000",
	annualQuartile1ProportionMen: "40.0000",
	annualQuartile2ProportionMen: "45.0000",
	annualQuartile3ProportionMen: "50.0000",
	annualQuartile4ProportionMen: "60.0000",
	hourlyQuartile1ProportionWomen: "61.0000",
	hourlyQuartile2ProportionWomen: "56.0000",
	hourlyQuartile3ProportionWomen: "51.0000",
	hourlyQuartile4ProportionWomen: "41.0000",
	hourlyQuartile1ProportionMen: "39.0000",
	hourlyQuartile2ProportionMen: "44.0000",
	hourlyQuartile3ProportionMen: "49.0000",
	hourlyQuartile4ProportionMen: "59.0000",
};

const companyFixture: PublicCompanySource = {
	siren: "123456789",
	name: "Société Démo",
	address: "1 rue de la Paix, 75002 Paris",
	region: "Île-de-France",
	departmentCode: "75",
	departmentLabel: "Paris",
	nafCode: "62.01Z",
	nafLabel: "Programmation informatique",
	statutDiffusion: "O",
	workforceEma: "250.0000",
};

const EXPECTED_DTO_KEYS = Object.keys(publicDeclarationDTOSchema.shape).sort();

const MASKED_COMPANY_FIELDS = ["name", "address"] as const;

const FORBIDDEN_KEYS = [
	"categoryScore",
	"remunerationScore",
	"variableRemunerationScore",
	"quartileScore",
	"globalScore",
	"index",
	"workforce",
	"declarantId",
	"status",
	"draft",
];

describe("isCompanyDiffusible", () => {
	it("returns false when the statut is 'N'", () => {
		expect(isCompanyDiffusible("N")).toBe(false);
	});

	it("returns true when the statut is null", () => {
		expect(isCompanyDiffusible(null)).toBe(true);
	});

	it("returns true when the statut is 'O'", () => {
		expect(isCompanyDiffusible("O")).toBe(true);
	});

	it("returns true for any other statut value", () => {
		expect(isCompanyDiffusible("P")).toBe(true);
		expect(isCompanyDiffusible("")).toBe(true);
	});
});

describe("toPublicDeclaration", () => {
	it("exposes exactly the DTO whitelist and nothing else", () => {
		const dto = toPublicDeclaration(declarationFixture, companyFixture);

		expect(Object.keys(dto).sort()).toEqual(EXPECTED_DTO_KEYS);
		expect(() => publicDeclarationDTOSchema.parse(dto)).not.toThrow();
	});

	it("never leaks scores, the global /100 index, or indicator G data", () => {
		const dto = toPublicDeclaration(
			{ ...declarationFixture },
			{ ...companyFixture },
		) as Record<string, unknown>;

		for (const forbidden of FORBIDDEN_KEYS) {
			expect(dto).not.toHaveProperty(forbidden);
		}
		expect(
			Object.keys(dto).some((key) => /score|category|index/i.test(key)),
		).toBe(false);
	});

	it("exposes the full company whitelist for a diffusible company", () => {
		const dto = toPublicDeclaration(declarationFixture, companyFixture);

		expect(dto.siren).toBe("123456789");
		expect(dto.name).toBe("Société Démo");
		expect(dto.address).toBe("1 rue de la Paix, 75002 Paris");
		expect(dto.region).toBe("Île-de-France");
		expect(dto.departmentCode).toBe("75");
		expect(dto.departmentLabel).toBe("Paris");
		expect(dto.nafCode).toBe("62.01Z");
		expect(dto.nafLabel).toBe("Programmation informatique");
	});

	it("masks company identity fields when the company is non-diffusible", () => {
		const dto = toPublicDeclaration(declarationFixture, {
			...companyFixture,
			statutDiffusion: "N",
		});

		expect(dto.name).toBe("Non-diffusible");
		expect(dto.address).toBe("Non-diffusible");
		expect(dto.departmentCode).toBe("75");
		expect(dto.departmentLabel).toBe("Paris");
		expect(dto.nafCode).toBe("62.01Z");
	});

	it("derives diffusibility from a non-null address when statutDiffusion is null", () => {
		const dto = toPublicDeclaration(declarationFixture, {
			...companyFixture,
			statutDiffusion: null,
		});

		expect(dto.name).toBe("Société Démo");
		expect(dto.address).toBe("1 rue de la Paix, 75002 Paris");
		expect(dto.region).toBe("Île-de-France");
		expect(dto.nafCode).toBe("62.01Z");
	});

	it("masks company identity when statutDiffusion is null and the address is null", () => {
		const dto = toPublicDeclaration(declarationFixture, {
			...companyFixture,
			statutDiffusion: null,
			address: null,
		});

		expect(dto.name).toBe("Non-diffusible");
		expect(dto.address).toBe("Non-diffusible");
		expect(dto.departmentCode).toBe("75");
		expect(dto.siren).toBe("123456789");
		expect(dto.workforceEma).toBe(250);
	});

	it("keeps siren, year, workforceEma and every indicator for a non-diffusible company", () => {
		const diffusible = toPublicDeclaration(declarationFixture, companyFixture);
		const nonDiffusible = toPublicDeclaration(declarationFixture, {
			...companyFixture,
			statutDiffusion: "N",
		});

		expect(nonDiffusible.siren).toBe(companyFixture.siren);
		expect(nonDiffusible.year).toBe(declarationFixture.year);
		expect(nonDiffusible.workforceEma).toBe(250);

		const indicatorKeys = EXPECTED_DTO_KEYS.filter(
			(key) =>
				key !== "siren" &&
				key !== "year" &&
				key !== "workforceEma" &&
				!MASKED_COMPANY_FIELDS.includes(
					key as (typeof MASKED_COMPANY_FIELDS)[number],
				),
		);
		for (const key of indicatorKeys) {
			expect(nonDiffusible[key as keyof typeof nonDiffusible]).toEqual(
				diffusible[key as keyof typeof diffusible],
			);
		}
	});

	it("uses the country instead of a French region for a foreign company", () => {
		const dto = toPublicDeclaration(declarationFixture, {
			...companyFixture,
			countryCode: "99131",
			countryLabel: "Belgique",
		});

		expect(dto.countryLabel).toBe("Belgique");
		expect(dto.region).toBeNull();
	});

	it("converts numeric string gaps to numbers and preserves year and counts", () => {
		const dto = toPublicDeclaration(declarationFixture, companyFixture);

		expect(dto.year).toBe(2024);
		expect(dto.totalWomen).toBe(120);
		expect(dto.totalMen).toBe(80);
		expect(dto.globalAnnualMeanGap).toBe(0.1234);
		expect(dto.variableProportionWomen).toBe(0.5625);
		expect(dto.annualQuartile4ProportionMen).toBe(60);
		expect(dto.hourlyQuartile1ProportionWomen).toBe(61);
		expect(dto.workforceEma).toBe(250);
	});

	it("serves the raw stored gap ratio without scaling it to a percentage", () => {
		// A stored ratio of 0.0523 (i.e. a 5.23% gap) must be exposed as-is:
		// the public API contract is the ratio, so no × 100 conversion may be introduced.
		const dto = toPublicDeclaration(
			{
				...declarationFixture,
				globalAnnualMeanGap: "0.0523",
				variableAnnualMedianGap: "-0.0312",
			},
			companyFixture,
		);

		expect(dto.globalAnnualMeanGap).toBe(0.0523);
		expect(dto.globalAnnualMeanGap).not.toBe(5.23);
		expect(dto.variableAnnualMedianGap).toBe(-0.0312);
	});

	it("maps null numeric inputs to null", () => {
		const dto = toPublicDeclaration(
			{ ...declarationFixture, globalAnnualMeanGap: null },
			{ ...companyFixture, workforceEma: null },
		);

		expect(dto.globalAnnualMeanGap).toBeNull();
		expect(dto.workforceEma).toBeNull();
	});

	it("maps non-numeric strings to null", () => {
		const dto = toPublicDeclaration(
			{ ...declarationFixture, globalHourlyMeanGap: "NR" },
			companyFixture,
		);

		expect(dto.globalHourlyMeanGap).toBeNull();
	});

	it("passes through null integer counts", () => {
		const dto = toPublicDeclaration(
			{ ...declarationFixture, totalWomen: null, totalMen: null },
			companyFixture,
		);

		expect(dto.totalWomen).toBeNull();
		expect(dto.totalMen).toBeNull();
	});
});

describe("publicSearchInputSchema", () => {
	it("applies default limit and offset", () => {
		const parsed = publicSearchInputSchema.parse({});

		expect(parsed.limit).toBe(10);
		expect(parsed.offset).toBe(0);
	});

	it("reads a facet given once as a single-entry list", () => {
		const parsed = publicSearchInputSchema.parse({
			q: "acme",
			region: "Île-de-France",
			departement: "75",
			naf: "62.01Z",
			year: 2024,
			limit: 50,
			offset: 20,
		});

		expect(parsed).toEqual({
			q: "acme",
			region: ["Île-de-France"],
			departement: ["75"],
			naf: ["62.01Z"],
			year: 2024,
			limit: 50,
			offset: 20,
		});
	});

	it("keeps every value of a repeated facet", () => {
		const parsed = publicSearchInputSchema.parse({
			region: ["11", "84"],
			workforceRanges: ["<50", "1000+"],
			limit: 10,
		});

		expect(parsed.region).toEqual(["11", "84"]);
		expect(parsed.workforceRanges).toEqual(["<50", "1000+"]);
	});

	it("drops blank facet entries instead of filtering on them", () => {
		const parsed = publicSearchInputSchema.parse({
			region: ["", "  ", "11"],
			naf: [""],
			limit: 10,
		});

		expect(parsed.region).toEqual(["11"]);
		expect(parsed.naf).toBeUndefined();
	});

	it("refuses a facet longer than any real vocabulary", () => {
		const flood = Array.from({ length: 201 }, (_, index) => `r${index}`);

		expect(publicSearchInputSchema.safeParse({ region: flood }).success).toBe(
			false,
		);
	});

	it("rejects a workforce bracket that is not one of the observatory keys", () => {
		expect(
			publicSearchInputSchema.safeParse({ workforceRanges: ["12-34"] }).success,
		).toBe(false);
	});

	it("rejects a limit above 100", () => {
		expect(publicSearchInputSchema.safeParse({ limit: 101 }).success).toBe(
			false,
		);
	});

	it("rejects a limit below 1", () => {
		expect(publicSearchInputSchema.safeParse({ limit: 0 }).success).toBe(false);
	});

	it("rejects a negative offset", () => {
		expect(publicSearchInputSchema.safeParse({ offset: -1 }).success).toBe(
			false,
		);
	});

	it("rejects an empty q filter", () => {
		expect(publicSearchInputSchema.safeParse({ q: "" }).success).toBe(false);
	});
});
