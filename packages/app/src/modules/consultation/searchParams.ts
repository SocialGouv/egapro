import { z } from "zod";
import type { PublicSearchInput } from "~/modules/public-api";
import { PUBLIC_PAGE_SIZE } from "./constants";

const searchParamsSchema = z.object({
	q: z.string().trim().max(200).catch(""),
	city: z.string().trim().max(100).catch(""),
	region: z.string().trim().max(100).catch(""),
	departement: z.string().trim().max(3).catch(""),
	naf: z.string().trim().max(2).catch(""),
	workforce: z.string().trim().max(20).catch(""),
	year: z.coerce.number().int().min(2000).max(2100).optional().catch(undefined),
	sort: z.enum(["relevance", "name"]).catch("relevance"),
	page: z.coerce.number().int().min(1).catch(1),
});

export type ConsultationSearchParams = z.infer<typeof searchParamsSchema>;

export function parseConsultationSearchParams(
	raw: Record<string, string | string[] | undefined>,
): ConsultationSearchParams {
	const firstValues = Object.fromEntries(
		Object.entries(raw).map(([key, value]) => [
			key,
			Array.isArray(value) ? value[0] : value,
		]),
	);
	return searchParamsSchema.parse(firstValues);
}

export function toPublicSearchInput(
	params: ConsultationSearchParams,
): PublicSearchInput {
	const [minRaw, maxRaw] = params.workforce.split("-");
	const workforceMin = minRaw ? Number.parseInt(minRaw, 10) : undefined;
	const workforceMax = maxRaw ? Number.parseInt(maxRaw, 10) : undefined;
	return {
		q: params.q || undefined,
		city: params.city || undefined,
		region: params.region || undefined,
		departement: params.departement || undefined,
		naf: params.naf || undefined,
		workforceMin,
		workforceMax,
		year: params.year,
		sort: params.sort,
		limit: PUBLIC_PAGE_SIZE,
		offset: (params.page - 1) * PUBLIC_PAGE_SIZE,
	};
}

export function hasSearchCriteria(params: ConsultationSearchParams): boolean {
	return Boolean(
		params.q ||
			params.city ||
			params.region ||
			params.departement ||
			params.naf ||
			params.workforce ||
			params.year,
	);
}
