import "server-only";

import { declarationSearchRepo } from "@api/core-domain/repo";
import { SearchDeclaration } from "@api/core-domain/useCases/SearchDeclaration";
import { type SearchConsultationDTO } from "@common/core-domain/dtos/helpers/common";

const useCase = new SearchDeclaration(declarationSearchRepo);

/**
 * Server side direct search for declarations in database.
 */
export const search = async (input: SearchConsultationDTO) => {
  return useCase.execute({
    ...input,
  });
};
