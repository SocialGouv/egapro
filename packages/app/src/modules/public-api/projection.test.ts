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
	globalAnnualMeanGap: "12.3400",
	globalAnnualMedianGap: "10.0000",
	globalHourlyMeanGap: "8.5000",
	globalHourlyMedianGap: "7.2500",
	variableAnnualMeanGap: "5.5000",
	variableAnnualMedianGap: "4.1000",
	variableHourlyMeanGap: "3.3000",
	variableHourlyMedianGap: "2.2000",
	variableProportionWomen: "45.0000",
	variableProportionMen: "55.0000",
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

const MASKED_COMPANY_FIELDS = [
	"name",
	"address",
	"region",
	"departmentCode",
	"departmentLabel",
	"nafCode",
	"nafLabel",
] as const;

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

		for (const field of MASKED_COMPANY_FIELDS) {
			expect(dto[field]).toBeNull();
		}
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

		for (const field of MASKED_COMPANY_FIELDS) {
			expect(dto[field]).toBeNull();
		}
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

	it("converts numeric string gaps to numbers and preserves year and counts", () => {
		const dto = toPublicDeclaration(declarationFixture, companyFixture);

		expect(dto.year).toBe(2024);
		expect(dto.totalWomen).toBe(120);
		expect(dto.totalMen).toBe(80);
		expect(dto.globalAnnualMeanGap).toBe(12.34);
		expect(dto.variableProportionWomen).toBe(45);
		expect(dto.annualQuartile4ProportionMen).toBe(60);
		expect(dto.hourlyQuartile1ProportionWomen).toBe(61);
		expect(dto.workforceEma).toBe(250);
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

	it("accepts the optional filters", () => {
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
			region: "Île-de-France",
			departement: "75",
			naf: "62.01Z",
			year: 2024,
			limit: 50,
			offset: 20,
		});
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
