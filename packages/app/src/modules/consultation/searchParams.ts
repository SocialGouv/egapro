import { z } from "zod";
import {
	isObservatoryWorkforceRange,
	type ObservatoryWorkforceRange,
} from "~/modules/domain";
import type { PublicSearchInput } from "~/modules/public-api";
import {
	DEFAULT_PAGE_SIZE,
	FACET_KEYS,
	PAGE_SIZE_OPTIONS,
	SEARCH_PATH,
} from "./constants";

/** A URL facet: absent, single, or repeated — always read as a list. */
function facet(raw: string | string[] | undefined): string[] {
	if (raw === undefined) return [];
	return (Array.isArray(raw) ? raw : [raw])
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
}

const scalarSchema = z.object({
	q: z.string().trim().max(200).catch(""),
	page: z.coerce.number().int().min(1).catch(1),
	limit: z.coerce
		.number()
		.int()
		.refine((value): value is number =>
			(PAGE_SIZE_OPTIONS as readonly number[]).includes(value),
		)
		.catch(DEFAULT_PAGE_SIZE),
});

export type ConsultationSearchParams = {
	q: string;
	region: string[];
	departement: string[];
	naf: string[];
	workforceRanges: ObservatoryWorkforceRange[];
	page: number;
	limit: number;
};

export function parseConsultationSearchParams(
	raw: Record<string, string | string[] | undefined>,
): ConsultationSearchParams {
	const scalar = scalarSchema.parse({
		q: Array.isArray(raw.q) ? raw.q[0] : raw.q,
		page: Array.isArray(raw.page) ? raw.page[0] : raw.page,
		limit: Array.isArray(raw.limit) ? raw.limit[0] : raw.limit,
	});
	return {
		...scalar,
		region: facet(raw.region),
		departement: facet(raw.departement),
		naf: facet(raw.naf),
		// An unknown bracket key is dropped rather than passed through: it would
		// resolve to no bounds and silently widen the search instead of narrowing it.
		workforceRanges: facet(raw.workforceRanges).filter(
			isObservatoryWorkforceRange,
		),
	};
}

export function toPublicSearchInput(
	params: ConsultationSearchParams,
): PublicSearchInput {
	const list = (values: string[]) => (values.length > 0 ? values : undefined);
	return {
		q: params.q || undefined,
		region: list(params.region),
		departement: list(params.departement),
		naf: list(params.naf),
		workforceRanges:
			params.workforceRanges.length > 0 ? params.workforceRanges : undefined,
		limit: params.limit,
		offset: (params.page - 1) * params.limit,
	};
}

/**
 * Serialise the facets back to a query string. `overrides` replaces a key
 * outright, so pagination and page-size links stay on the current criteria.
 */
export function buildSearchQuery(
	params: ConsultationSearchParams,
	overrides: Partial<Record<"page" | "limit", number>> = {},
): string {
	const query = new URLSearchParams();
	if (params.q) query.set("q", params.q);
	for (const value of params.region) query.append("region", value);
	for (const value of params.departement) query.append("departement", value);
	for (const value of params.naf) query.append("naf", value);
	for (const value of params.workforceRanges) {
		query.append("workforceRanges", value);
	}
	const limit = overrides.limit ?? params.limit;
	if (limit !== DEFAULT_PAGE_SIZE) query.set("limit", String(limit));
	const page = overrides.page ?? params.page;
	if (page > 1) query.set("page", String(page));
	return query.toString();
}

/**
 * The search a company page was reached from, so "Retour" lands back on the
 * caller's criteria. The string is re-parsed through the facet whitelist rather
 * than reflected: an unknown or hostile key never reaches the rebuilt URL.
 */
export function backToSearchHref(from: string | undefined): string {
	if (!from) return SEARCH_PATH;
	const query = new URLSearchParams(from);
	const raw: Record<string, string | string[]> = {};
	for (const key of new Set(query.keys())) {
		const values = query.getAll(key);
		const first = values[0];
		if (first === undefined) continue;
		raw[key] = values.length > 1 ? values : first;
	}
	return searchHref(parseConsultationSearchParams(raw));
}

export function searchHref(
	params: ConsultationSearchParams,
	overrides: Partial<Record<"page" | "limit", number>> = {},
): string {
	const query = buildSearchQuery(params, overrides);
	return query ? `${SEARCH_PATH}?${query}` : SEARCH_PATH;
}

export function exportHref(
	path: string,
	params: ConsultationSearchParams,
): string {
	const exportQuery = new URLSearchParams({ format: "csv" });
	const searchQuery = new URLSearchParams(buildSearchQuery(params));
	for (const key of FACET_KEYS) {
		for (const value of searchQuery.getAll(key)) {
			exportQuery.append(key, value);
		}
	}
	return `${path}?${exportQuery}`;
}
