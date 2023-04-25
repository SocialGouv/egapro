import { type ConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import {
  type SearchRepresentationEquilibreeInputDTO,
  type SearchRepresentationEquilibreeResultDTO,
} from "@common/core-domain/dtos/SearchRepresentationEquilibreeDTO";
import { representationEquilibreeSearchResultMap } from "@common/core-domain/mappers/representationEquilibreeSearchResultMap";
import type { UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";

import { type IRepresentationEquilibreeSearchRepo } from "../repo/IRepresentationEquilibreeSearchRepo";

export class SearchRepresentationEquilibree
  implements UseCase<SearchRepresentationEquilibreeInputDTO, ConsultationDTO<SearchRepresentationEquilibreeResultDTO>>
{
  constructor(private readonly representationEquilibreeSearchRepo: IRepresentationEquilibreeSearchRepo) {}

  public async execute(
    criteria: SearchRepresentationEquilibreeInputDTO,
  ): Promise<ConsultationDTO<SearchRepresentationEquilibreeResultDTO>> {
    const count = await this.representationEquilibreeSearchRepo.count(criteria);

    try {
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
