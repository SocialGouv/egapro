import { config } from "@common/config";
import { type ConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import {
  type SearchDeclarationDTO,
  type SearchDeclarationResultDTO,
} from "@common/core-domain/dtos/SearchDeclarationDTO";
import { declarationSearchResultMap } from "@common/core-domain/mappers/declarationSearchResultMap";
import { AppError } from "@common/shared-domain";
import { AbstractCachedUsedCase, type CachedUseCaseOptions } from "@common/shared-domain/AbstractCachedUsedCase";

import { type DeclarationSearchCriteria, type IDeclarationSearchRepo } from "../repo/IDeclarationSearchRepo";

export class SearchDeclaration extends AbstractCachedUsedCase<
  SearchDeclarationDTO,
  ConsultationDTO<SearchDeclarationResultDTO>
> {
  protected cacheMasterKey = "SearchDeclaration";
  protected defaultOptions: CachedUseCaseOptions = {
    revalidate: config.searchRevalidate,
  };

  constructor(private readonly declarationSearchRepo: IDeclarationSearchRepo) {
    super();
  }

  protected async run(input: SearchDeclarationDTO): Promise<ConsultationDTO<SearchDeclarationResultDTO>> {
    try {
      const criteria: DeclarationSearchCriteria = {
        ...input,
        offset: input.page > 0 ? input.page * input.limit : 0,
      };
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
