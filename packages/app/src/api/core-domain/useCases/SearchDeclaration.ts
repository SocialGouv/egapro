import { type ConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import {
  type SearchDeclarationInputDTO,
  type SearchDeclarationResultDTO,
} from "@common/core-domain/dtos/SearchDeclarationDTO";
import { declarationSearchResultMap } from "@common/core-domain/mappers/declarationSearchResultMap";
import { AppError } from "@common/shared-domain";
import { AbstractCachedUsedCase, type CachedUseCaseOptions } from "@common/shared-domain/AbstractCachedUsedCase";

import { type IDeclarationSearchRepo } from "../repo/IDeclarationSearchRepo";

type Input = SearchDeclarationInputDTO;
type Output = ConsultationDTO<SearchDeclarationResultDTO>;
export class SearchDeclaration extends AbstractCachedUsedCase<Input, Output> {
  protected cacheMasterKey = "SearchDeclaration";
  protected defaultOptions: CachedUseCaseOptions = {
    revalidate: 60 * 5,
  };

  constructor(private readonly declarationSearchRepo: IDeclarationSearchRepo) {
    super();
  }

  protected async run(criteria: Input): Promise<Output> {
    try {
      const count = await this.declarationSearchRepo.count(criteria);
      const results = await this.declarationSearchRepo.search(criteria);

      const data = results.map(declarationSearchResultMap.toDTO);
      return {
        count,
        data,
      };
    } catch (error: unknown) {
      console.error(error);
      throw new SearchDeclarationError("Cannot search declaration", error as Error);
    }
  }
}

export class SearchDeclarationError extends AppError {}
