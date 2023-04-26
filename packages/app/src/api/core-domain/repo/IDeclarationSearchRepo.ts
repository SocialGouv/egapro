import { type Declaration } from "@common/core-domain/domain/Declaration";
import { type DeclarationSearchResult } from "@common/core-domain/domain/DeclarationSearchResult";
import { type DeclarationStatsDTO } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { type SearchDefaultCriteria, type SearchRepo } from "@common/shared-domain";

export interface DeclarationSearchCriteria extends SearchDefaultCriteria {
  countyCode?: string;
  nafSection?: string;
  query?: string;
  regionCode?: string;
}

export interface DeclarationStatsCriteria {
  countyCode?: string;
  nafSection?: string;
  regionCode?: string;
  year?: string;
}

export interface IDeclarationSearchRepo
  extends SearchRepo<Declaration, DeclarationSearchResult, DeclarationSearchCriteria> {
  // we can directly return a DTO as it is full computed data. No validation required.
  stats(criteria: DeclarationStatsCriteria): Promise<DeclarationStatsDTO>;
}
