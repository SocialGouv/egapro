import type { RepresentationEquilibree } from "@common/core-domain/domain/RepresentationEquilibree";
import { type RepresentationEquilibreeSearchResult } from "@common/core-domain/domain/RepresentationEquilibreeSearchResult";
import type { SearchDefaultCriteria, SearchRepo } from "@common/shared-domain";

export interface RepresentationEquilibreeSearchCriteria extends SearchDefaultCriteria {
  countyCode?: string;
  nafSection?: string;
  query?: string;
  regionCode?: string;
}
export type IRepresentationEquilibreeSearchRepo = SearchRepo<
  RepresentationEquilibree,
  RepresentationEquilibreeSearchResult,
  RepresentationEquilibreeSearchCriteria
>;
