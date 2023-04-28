import { config } from "@common/config";
import { type DeclarationStatsDTO } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { AppError } from "@common/shared-domain";
import { AbstractCachedUsedCase, type CachedUseCaseOptions } from "@common/shared-domain/AbstractCachedUsedCase";

import { type DeclarationStatsCriteria, type IDeclarationSearchRepo } from "../repo/IDeclarationSearchRepo";

export class GetDeclarationStats extends AbstractCachedUsedCase<DeclarationStatsCriteria, DeclarationStatsDTO> {
  protected cacheMasterKey = "GetDeclarationStats";
  protected defaultOptions: CachedUseCaseOptions = {
    revalidate: config.searchRevalidate,
  };

  constructor(private readonly declarationSearchRepo: IDeclarationSearchRepo) {
    super();
  }

  protected run(criteria: DeclarationStatsCriteria): Promise<DeclarationStatsDTO> {
    try {
      return this.declarationSearchRepo.stats({
        ...criteria,
        year: criteria.year - 1,
      });
    } catch (error: unknown) {
      console.error(error);
      throw new GetDeclarationStatsError("Cannot get declaration stats", error as Error);
    }
  }
}

export class GetDeclarationStatsError extends AppError {}
