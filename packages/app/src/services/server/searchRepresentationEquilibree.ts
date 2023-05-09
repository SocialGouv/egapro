import "server-only";

import { representationEquilibreeSearchRepo } from "@api/core-domain/repo";
import { SearchRepresentationEquilibree } from "@api/core-domain/useCases/SearchRepresentationEquilibree";
import { type SearchConsultationDTO } from "@common/core-domain/dtos/helpers/common";

const useCase = new SearchRepresentationEquilibree(representationEquilibreeSearchRepo);

/**
 * Server side direct search for représentation équilibrée in database.
 */
export const search = async (input: SearchConsultationDTO) => {
  return useCase.execute({
    ...input,
  });
};
