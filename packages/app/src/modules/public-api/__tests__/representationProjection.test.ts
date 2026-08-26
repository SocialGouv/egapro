import { describe, expect, it } from "vitest";
import { isCompanyDiffusible } from "../projection";
import {
	type PublicRepresentationCompanySource,
	type PublicRepresentationSource,
	publicRepresentationColumns,
	toPublicRepresentation,
} from "../representationProjection";
import {
	publicRepresentationDTOSchema,
	publicRepresentationSearchInputSchema,
} from "../schemas";

const declarationFixture: PublicRepresentationSource = {
	year: 2026,
	referencePeriodStart: "2025-01-01",
	referencePeriodEnd: "2025-12-31",
	executiveWomenPercent: "35.50",
	executiveMenPercent: "64.50",
	notComputableReasonExecutives: null,
	memberWomenPercent: "42.00",
	memberMenPercent: "58.00",
	notComputableReasonMembers: null,
	publishDate: "2026-02-15",
	publishUrl: "https://exemple.fr/egalite-professionnelle",
	publishModalities: null,
};

const companyFixture: PublicRepresentationCompanySource = {
	siren: "123456789",
	name: "Société Démo",
	address: "1 rue de la Paix, 75002 Paris",
	region: "Île-de-France",
	departmentCode: "75",
	departmentLabel: "Paris",
	nafCode: "62.01Z",
	nafLabel: "Programmation informatique",
	statutDiffusion: "O",
};

const EXPECTED_DTO_KEYS = Object.keys(
	publicRepresentationDTOSchema.shape,
).sort();

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
	"verdict",
	"isCompliant",
	"compliance",
	"score",
	"globalScore",
	"index",
	"status",
	"draft",
	"declarantId",
	"currentStep",
	"submittedAt",
];

describe("publicRepresentationColumns", () => {
	it("selects exactly the declaration columns backing the DTO", () => {
		expect(Object.keys(publicRepresentationColumns).sort()).toEqual([
			"executiveMenPercent",
			"executiveWomenPercent",
			"memberMenPercent",
			"memberWomenPercent",
			"notComputableReasonExecutives",
			"notComputableReasonMembers",
			"publishDate",
			"publishModalities",
			"publishUrl",
			"referencePeriodEnd",
			"referencePeriodStart",
			"year",
		]);
	});

	it("covers every DTO field that does not come from the company row", () => {
		const companyFields = new Set<string>(["siren", ...MASKED_COMPANY_FIELDS]);
		const declarationFields = EXPECTED_DTO_KEYS.filter(
			(key) => !companyFields.has(key),
		);

		expect(Object.keys(publicRepresentationColumns).sort()).toEqual(
			declarationFields,
		);
	});
});

describe("toPublicRepresentation", () => {
	it("exposes exactly the DTO whitelist and nothing else", () => {
		const dto = toPublicRepresentation(declarationFixture, companyFixture);

		expect(Object.keys(dto).sort()).toEqual(EXPECTED_DTO_KEYS);
		expect(() => publicRepresentationDTOSchema.parse(dto)).not.toThrow();
	});

	it("never leaks a compliance verdict, a score or declaration internals", () => {
		const dto = toPublicRepresentation(
			declarationFixture,
			companyFixture,
		) as Record<string, unknown>;

		for (const forbidden of FORBIDDEN_KEYS) {
			expect(dto).not.toHaveProperty(forbidden);
		}
		expect(
			Object.keys(dto).some((key) =>
				/score|verdict|conform|index|note/i.test(key),
			),
		).toBe(false);
	});

	it("exposes the full company whitelist for a diffusible company", () => {
		const dto = toPublicRepresentation(declarationFixture, companyFixture);

		expect(dto.siren).toBe("123456789");
		expect(dto.name).toBe("Société Démo");
		expect(dto.address).toBe("1 rue de la Paix, 75002 Paris");
		expect(dto.region).toBe("Île-de-France");
		expect(dto.departmentCode).toBe("75");
		expect(dto.departmentLabel).toBe("Paris");
		expect(dto.nafCode).toBe("62.01Z");
		expect(dto.nafLabel).toBe("Programmation informatique");
	});

	it("masks identity and location for a non-diffusible company (S27)", () => {
		const dto = toPublicRepresentation(declarationFixture, {
			...companyFixture,
			statutDiffusion: "N",
		});

		for (const field of MASKED_COMPANY_FIELDS) {
			expect(dto[field]).toBeNull();
		}
	});

	it("keeps siren, year and every gap for a non-diffusible company (S27)", () => {
		const diffusible = toPublicRepresentation(
			declarationFixture,
			companyFixture,
		);
		const nonDiffusible = toPublicRepresentation(declarationFixture, {
			...companyFixture,
			statutDiffusion: "N",
		});

		expect(nonDiffusible.siren).toBe("123456789");
		expect(nonDiffusible.year).toBe(2026);
		expect(nonDiffusible.executiveWomenPercent).toBe(35.5);
		expect(nonDiffusible.memberWomenPercent).toBe(42);

		const keptKeys = EXPECTED_DTO_KEYS.filter(
			(key) =>
				!MASKED_COMPANY_FIELDS.includes(
					key as (typeof MASKED_COMPANY_FIELDS)[number],
				),
		);
		for (const key of keptKeys) {
			expect(nonDiffusible[key as keyof typeof nonDiffusible]).toEqual(
				diffusible[key as keyof typeof diffusible],
			);
		}
	});

	it("delegates the masking decision to isCompanyDiffusible for every statut", () => {
		for (const statutDiffusion of ["O", "N", "P", "", null]) {
			const dto = toPublicRepresentation(declarationFixture, {
				...companyFixture,
				statutDiffusion,
			});

			expect(dto.name).toBe(
				isCompanyDiffusible(statutDiffusion) ? "Société Démo" : null,
			);
		}
	});

	it("converts the numeric percentage strings to numbers", () => {
		const dto = toPublicRepresentation(declarationFixture, companyFixture);

		expect(dto.executiveWomenPercent).toBe(35.5);
		expect(dto.executiveMenPercent).toBe(64.5);
		expect(dto.memberWomenPercent).toBe(42);
		expect(dto.memberMenPercent).toBe(58);
	});

	it("maps null percentages to null and keeps the non-computable reasons", () => {
		const dto = toPublicRepresentation(
			{
				...declarationFixture,
				executiveWomenPercent: null,
				executiveMenPercent: null,
				notComputableReasonExecutives: "aucun_cadre_dirigeant",
				memberWomenPercent: null,
				memberMenPercent: null,
				notComputableReasonMembers: "aucune_instance_dirigeante",
			},
			companyFixture,
		);

		expect(dto.executiveWomenPercent).toBeNull();
		expect(dto.executiveMenPercent).toBeNull();
		expect(dto.notComputableReasonExecutives).toBe("aucun_cadre_dirigeant");
		expect(dto.memberWomenPercent).toBeNull();
		expect(dto.memberMenPercent).toBeNull();
		expect(dto.notComputableReasonMembers).toBe("aucune_instance_dirigeante");
		expect(() => publicRepresentationDTOSchema.parse(dto)).not.toThrow();
	});

	it("maps a non-numeric percentage to null", () => {
		const dto = toPublicRepresentation(
			{ ...declarationFixture, executiveWomenPercent: "NR" },
			companyFixture,
		);

		expect(dto.executiveWomenPercent).toBeNull();
	});

	it("passes the reference period and publication fields through unchanged", () => {
		const dto = toPublicRepresentation(
			{
				...declarationFixture,
				publishUrl: null,
				publishModalities: "Affichage dans les locaux",
			},
			companyFixture,
		);

		expect(dto.referencePeriodStart).toBe("2025-01-01");
		expect(dto.referencePeriodEnd).toBe("2025-12-31");
		expect(dto.publishDate).toBe("2026-02-15");
		expect(dto.publishUrl).toBeNull();
		expect(dto.publishModalities).toBe("Affichage dans les locaux");
	});

	it("passes through a fully empty declaration without inventing values", () => {
		const dto = toPublicRepresentation(
			{
				...declarationFixture,
				referencePeriodStart: null,
				referencePeriodEnd: null,
				publishDate: null,
				publishUrl: null,
				publishModalities: null,
			},
			companyFixture,
		);

		expect(dto.referencePeriodStart).toBeNull();
		expect(dto.referencePeriodEnd).toBeNull();
		expect(dto.publishDate).toBeNull();
		expect(dto.publishUrl).toBeNull();
		expect(dto.publishModalities).toBeNull();
		expect(() => publicRepresentationDTOSchema.parse(dto)).not.toThrow();
	});
});

describe("publicRepresentationSearchInputSchema", () => {
	it("mirrors the declaration search contract", () => {
		expect(publicRepresentationSearchInputSchema.parse({})).toEqual({
			limit: 10,
			offset: 0,
		});
		expect(
			publicRepresentationSearchInputSchema.parse({
				q: "acme",
				region: "11",
				departement: "75",
				naf: "62.01Z",
				year: 2026,
				limit: 50,
				offset: 20,
			}),
		).toEqual({
			q: "acme",
			region: ["11"],
			departement: ["75"],
			naf: ["62.01Z"],
			year: 2026,
			limit: 50,
			offset: 20,
		});
		expect(
			publicRepresentationSearchInputSchema.safeParse({ limit: 101 }).success,
		).toBe(false);
		expect(
			publicRepresentationSearchInputSchema.safeParse({ limit: 0 }).success,
		).toBe(false);
		expect(
			publicRepresentationSearchInputSchema.safeParse({ offset: -1 }).success,
		).toBe(false);
		expect(
			publicRepresentationSearchInputSchema.safeParse({ q: "" }).success,
		).toBe(false);
	});
});
