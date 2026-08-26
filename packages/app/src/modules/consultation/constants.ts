/** Page sizes offered by the "lignes par page" select under the result list. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE: PageSize = 10;

export const SEARCH_PATH = "/index-egapro/recherche";

/** Upper bound on the years offered by the company page year selector. */
export const MAX_HISTORY_YEARS = 50;

/** Query keys the search form and the export links share, in URL order. */
export const FACET_KEYS = [
	"q",
	"region",
	"departement",
	"naf",
	"workforceRanges",
] as const;
