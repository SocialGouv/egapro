import { z } from "zod";

export const publicSearchInputSchema = z.object({
	q: z.string().trim().min(1).optional(),
	region: z.string().trim().min(1).optional(),
	departement: z.string().trim().min(1).optional(),
	naf: z.string().trim().min(1).optional(),
	year: z.number().int().optional(),
	limit: z.number().int().min(1).max(100).default(10),
	offset: z.number().int().min(0).default(0),
});

export type PublicSearchInput = z.infer<typeof publicSearchInputSchema>;

export const publicDeclarationDTOSchema = z.object({
	year: z.number().int(),
	siren: z.string(),
	name: z.string().nullable(),
	address: z.string().nullable(),
	region: z.string().nullable(),
	departmentCode: z.string().nullable(),
	departmentLabel: z.string().nullable(),
	nafCode: z.string().nullable(),
	nafLabel: z.string().nullable(),
	workforceEma: z.number().nullable(),
	totalWomen: z.number().int().nullable(),
	totalMen: z.number().int().nullable(),
	globalAnnualMeanGap: z.number().nullable(),
	globalAnnualMedianGap: z.number().nullable(),
	globalHourlyMeanGap: z.number().nullable(),
	globalHourlyMedianGap: z.number().nullable(),
	variableAnnualMeanGap: z.number().nullable(),
	variableAnnualMedianGap: z.number().nullable(),
	variableHourlyMeanGap: z.number().nullable(),
	variableHourlyMedianGap: z.number().nullable(),
	variableProportionWomen: z.number().nullable(),
	variableProportionMen: z.number().nullable(),
	annualQuartile1ProportionWomen: z.number().nullable(),
	annualQuartile2ProportionWomen: z.number().nullable(),
	annualQuartile3ProportionWomen: z.number().nullable(),
	annualQuartile4ProportionWomen: z.number().nullable(),
	annualQuartile1ProportionMen: z.number().nullable(),
	annualQuartile2ProportionMen: z.number().nullable(),
	annualQuartile3ProportionMen: z.number().nullable(),
	annualQuartile4ProportionMen: z.number().nullable(),
	hourlyQuartile1ProportionWomen: z.number().nullable(),
	hourlyQuartile2ProportionWomen: z.number().nullable(),
	hourlyQuartile3ProportionWomen: z.number().nullable(),
	hourlyQuartile4ProportionWomen: z.number().nullable(),
	hourlyQuartile1ProportionMen: z.number().nullable(),
	hourlyQuartile2ProportionMen: z.number().nullable(),
	hourlyQuartile3ProportionMen: z.number().nullable(),
	hourlyQuartile4ProportionMen: z.number().nullable(),
});

export type PublicDeclarationDTO = z.infer<typeof publicDeclarationDTOSchema>;

export const publicSearchResultDTOSchema = z.object({
	data: z.array(publicDeclarationDTOSchema),
	count: z.number().int(),
});

export type PublicSearchResultDTO = z.infer<typeof publicSearchResultDTOSchema>;

export const publicRepresentationSearchInputSchema = z.object({
	q: z.string().trim().min(1).optional(),
	region: z.string().trim().min(1).optional(),
	departement: z.string().trim().min(1).optional(),
	naf: z.string().trim().min(1).optional(),
	year: z.number().int().optional(),
	limit: z.number().int().min(1).max(100).default(10),
	offset: z.number().int().min(0).default(0),
});

export type PublicRepresentationSearchInput = z.infer<
	typeof publicRepresentationSearchInputSchema
>;

export const publicRepresentationDTOSchema = z.object({
	siren: z.string(),
	year: z.number().int(),
	name: z.string().nullable(),
	address: z.string().nullable(),
	region: z.string().nullable(),
	departmentCode: z.string().nullable(),
	departmentLabel: z.string().nullable(),
	nafCode: z.string().nullable(),
	nafLabel: z.string().nullable(),
	referencePeriodStart: z.string().nullable(),
	referencePeriodEnd: z.string().nullable(),
	executiveWomenPercent: z.number().nullable(),
	executiveMenPercent: z.number().nullable(),
	notComputableReasonExecutives: z
		.enum(["aucun_cadre_dirigeant", "un_seul_cadre_dirigeant"])
		.nullable(),
	memberWomenPercent: z.number().nullable(),
	memberMenPercent: z.number().nullable(),
	notComputableReasonMembers: z.enum(["aucune_instance_dirigeante"]).nullable(),
	publishDate: z.string().nullable(),
	publishUrl: z.string().nullable(),
	publishModalities: z.string().nullable(),
});

export type PublicRepresentationDTO = z.infer<
	typeof publicRepresentationDTOSchema
>;

export const publicRepresentationSearchResultDTOSchema = z.object({
	data: z.array(publicRepresentationDTOSchema),
	count: z.number().int(),
});

export type PublicRepresentationSearchResultDTO = z.infer<
	typeof publicRepresentationSearchResultDTOSchema
>;
