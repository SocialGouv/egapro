import { config } from "@common/config";
import { type ConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import {
  type SearchRepresentationEquilibreeDTO,
  type SearchRepresentationEquilibreeResultDTO,
} from "@common/core-domain/dtos/SearchRepresentationEquilibreeDTO";
import { representationEquilibreeSearchResultMap } from "@common/core-domain/mappers/representationEquilibreeSearchResultMap";
import { AppError } from "@common/shared-domain";
import { AbstractCachedUseCase, type CachedUseCaseOptions } from "@common/shared-domain/AbstractCachedUseCase";

import {
  type IRepresentationEquilibreeSearchRepo,
  type RepresentationEquilibreeSearchCriteria,
} from "../repo/IRepresentationEquilibreeSearchRepo";

export class SearchRepresentationEquilibree extends AbstractCachedUseCase<
  SearchRepresentationEquilibreeDTO,
  ConsultationDTO<SearchRepresentationEquilibreeResultDTO>
> {
  protected cacheMasterKey = "SearchRepresentationEquilibree";
  protected defaultOptions: CachedUseCaseOptions = {
    revalidate: config.searchRevalidate,
  };

  constructor(private readonly representationEquilibreeSearchRepo: IRepresentationEquilibreeSearchRepo) {
    super();
  }

  protected async run(
    input: SearchRepresentationEquilibreeDTO,
  ): Promise<ConsultationDTO<SearchRepresentationEquilibreeResultDTO>> {
    try {
      const criteria: RepresentationEquilibreeSearchCriteria = {
        ...input,
        offset: input.page > 0 ? input.page * input.limit : 0,
      };
      const count = await this.representationEquilibreeSearchRepo.count(criteria);
      const results = await this.representationEquilibreeSearchRepo.search(criteria);

      const data = results.map(representationEquilibreeSearchResultMap.toDTO);
      return {
        count,
        data,
      };
    } catch (error: unknown) {
      console.error(error);
      throw new SearchRepresentationEquilibreeError("Cannot search représentation équilibrée", error as Error);
    }
  }
}

export class SearchRepresentationEquilibreeError extends AppError {}
