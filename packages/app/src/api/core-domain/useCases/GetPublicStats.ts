import { config } from "@common/config";
import { type PublicStatsDTO } from "@common/core-domain/dtos/PublicStatsDTO";
import { publicStatsMap } from "@common/core-domain/mappers/publicStatsMap";
import { AppError } from "@common/shared-domain";
import { AbstractCachedUseCase, type CachedUseCaseOptions } from "@common/shared-domain/AbstractCachedUseCase";

import { type IDeclarationRepo } from "../repo/IDeclarationRepo";
import { type IPublicStatsRepo } from "../repo/IPublicStatsRepo";
import { type IRepresentationEquilibreeRepo } from "../repo/IRepresentationEquilibreeRepo";

const emptyPublicStats = {
  balancedRepresentation: {
    count: 0,
  },
  index: {
    count: 0,
  },
};

export class GetPublicStats extends AbstractCachedUseCase<never, PublicStatsDTO> {
  protected cacheMasterKey = "GetPublicStats";
  protected defaultOptions: CachedUseCaseOptions = {
    revalidate: config.searchRevalidate,
  };

  constructor(
    private readonly publicStatsRepo: IPublicStatsRepo,
    private readonly declarationRepo: IDeclarationRepo,
    private readonly representationEquilibreeRepo: IRepresentationEquilibreeRepo,
  ) {
    super();
  }

  protected async run(): Promise<PublicStatsDTO> {
    try {
      const countDeclaration = await this.declarationRepo.count();
      if (countDeclaration === 0) return emptyPublicStats as PublicStatsDTO;
      const countRepEq = await this.representationEquilibreeRepo.count();
      if (countRepEq === 0) return emptyPublicStats as PublicStatsDTO;

      const stats = await this.publicStatsRepo.getAll();
      console.log("stats", stats.index.lastThreeYearsAverage);
      return publicStatsMap.toDTO(stats);
    } catch (error: unknown) {
      console.error(error);
      throw new GetStatsError("Cannot get public stats", error as Error);
    }
  }
}

export class GetStatsError extends AppError {}
