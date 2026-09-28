import { z } from "zod";
import {
	OBSERVATORY_WORKFORCE_RANGE_KEYS,
	type ObservatoryWorkforceRange,
} from "~/modules/domain";

/**
 * Upper bound on how many values one facet may carry. Above every real
 * vocabulary — 101 départements is the longest — and low enough that a crafted
 * query string cannot turn one facet into a thousand-branch SQL predicate.
 */
export const FACET_MAX_VALUES = 200;

/**
 * A facet the caller may repeat: `?region=A&region=B`. A single value stays
 * valid so the documented scalar form of the public API keeps working, and
 * blanks are dropped rather than turned into a filter that matches nothing.
 */
function facetList<T extends z.ZodTypeAny>(item: T) {
	return z.preprocess((value) => {
		if (value === undefined || value === null) return undefined;
		const entries = (Array.isArray(value) ? value : [value])
			.map((entry) => (typeof entry === "string" ? entry.trim() : entry))
			.filter((entry) => entry !== "" && entry !== undefined && entry !== null);
		return entries.length > 0 ? entries : undefined;
	}, z.array(item).max(FACET_MAX_VALUES).optional());
}

const sharedSearchFields = {
	q: z.string().trim().min(1).optional(),
	region: facetList(z.string().min(1)),
	departement: facetList(z.string().min(1)),
	naf: facetList(z.string().min(1)),
	year: z.number().int().optional(),
	limit: z.number().int().min(1).max(100),
	offset: z.number().int().min(0).default(0),
};

export const PUBLIC_SEARCH_DEFAULT_LIMIT = 10;

const publicSearchQueryParamsSchema = z.object({
	...sharedSearchFields,
	city: z.string().trim().min(1).optional(),
	workforceMin: z.number().int().min(0).optional(),
	workforceMax: z.number().int().min(0).optional(),
	/**
	 * Workforce brackets of the observatory facet. Repeatable, and OR-ed with
	 * each other — unlike `workforceMin`/`workforceMax`, which stay in the API
	 * for callers that need an arbitrary window and are AND-ed on top.
	 */
	workforceRanges: facetList(
		z.enum(
			OBSERVATORY_WORKFORCE_RANGE_KEYS as [
				ObservatoryWorkforceRange,
				...ObservatoryWorkforceRange[],
			],
		),
	),
	sort: z.enum(["relevance", "name", "year"]).optional(),
	limit: z.number().int().min(1).max(100).default(PUBLIC_SEARCH_DEFAULT_LIMIT),
});

export const publicSearchInputSchema = publicSearchQueryParamsSchema;

export function parsePublicSearchInput(searchParams: URLSearchParams) {
	const workforceMin = searchParams.get("workforceMin");
	const workforceMax = searchParams.get("workforceMax");
	const year = searchParams.get("year");
	return publicSearchInputSchema.safeParse({
		q: searchParams.get("q") ?? undefined,
		city: searchParams.get("city") ?? undefined,
		region: searchParams.getAll("region"),
		departement: searchParams.getAll("departement"),
		naf: searchParams.getAll("naf"),
		workforceRanges: searchParams.getAll("workforceRanges"),
		workforceMin: workforceMin ? Number(workforceMin) : undefined,
		workforceMax: workforceMax ? Number(workforceMax) : undefined,
		year: year ? Number(year) : undefined,
		sort: searchParams.get("sort") ?? undefined,
	});
}

export type PublicSearchInput = z.infer<typeof publicSearchInputSchema>;

export const publicDeclarationDTOSchema = z.object({
	year: z.number().int(),
	siren: z.string(),
	name: z.string().nullable(),
	address: z.string().nullable(),
	city: z.string().nullable(),
	regionCode: z.string().nullable(),
	region: z.string().nullable(),
	departmentCode: z.string().nullable(),
	departmentLabel: z.string().nullable(),
	countryCode: z.string().nullable(),
	countryLabel: z.string().nullable(),
	nafCode: z.string().nullable(),
	nafLabel: z.string().nullable(),
	workforceEma: z.number().nullable(),
	totalWomen: z.number().int().nullable(),
	totalMen: z.number().int().nullable(),
	hourlyWomen: z.number().int().nullable(),
	hourlyMen: z.number().int().nullable(),
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
	...sharedSearchFields,
	limit: z.number().int().min(1).max(100).default(10),
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
