import { config } from "@common/config";
import { type PublicStatsDTO } from "@common/core-domain/dtos/PublicStatsDTO";
import { publicStatsMap } from "@common/core-domain/mappers/publicStatsMap";
import { AppError } from "@common/shared-domain";
import { AbstractCachedUseCase, type CachedUseCaseOptions } from "@common/shared-domain/AbstractCachedUseCase";

import { type IPublicStatsRepo } from "../repo/IPublicStatsRepo";

export class GetPublicStats extends AbstractCachedUseCase<never, PublicStatsDTO> {
  protected cacheMasterKey = "GetPublicStats";
  protected defaultOptions: CachedUseCaseOptions = {
    revalidate: config.searchRevalidate,
  };

  constructor(private readonly publicStatsRepo: IPublicStatsRepo) {
    super();
  }

  protected async run(): Promise<PublicStatsDTO> {
    try {
      const stats = await this.publicStatsRepo.getAll();
      return publicStatsMap.toDTO(stats);
    } catch (error: unknown) {
      console.error(error);
      throw new GetStatsError("Cannot get public stats", error as Error);
    }
  }
}

export class GetStatsError extends AppError {}
