import { type ConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import {
  type SearchRepresentationEquilibreeInputDTO,
  type SearchRepresentationEquilibreeResultDTO,
} from "@common/core-domain/dtos/SearchRepresentationEquilibreeDTO";
import { representationEquilibreeSearchResultMap } from "@common/core-domain/mappers/representationEquilibreeSearchResultMap";
import { AppError } from "@common/shared-domain";
import { AbstractCachedUsedCase, type CachedUseCaseOptions } from "@common/shared-domain/AbstractCachedUsedCase";

import { type IRepresentationEquilibreeSearchRepo } from "../repo/IRepresentationEquilibreeSearchRepo";

type Input = SearchRepresentationEquilibreeInputDTO;
type Output = ConsultationDTO<SearchRepresentationEquilibreeResultDTO>;
export class SearchRepresentationEquilibree extends AbstractCachedUsedCase<Input, Output> {
  protected cacheMasterKey = "SearchRepresentationEquilibree";
  protected defaultOptions: CachedUseCaseOptions = {
    revalidate: 60 * 5,
  };

  constructor(private readonly representationEquilibreeSearchRepo: IRepresentationEquilibreeSearchRepo) {
    super();
  }

  protected async run(criteria: Input): Promise<Output> {
    try {
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
