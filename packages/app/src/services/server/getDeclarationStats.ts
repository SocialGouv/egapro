import "server-only";

import { declarationSearchRepo } from "@api/core-domain/repo";
import { GetDeclarationStats } from "@api/core-domain/useCases/GetDeclarationStats";
import { type GetDeclarationStatsInput } from "@common/core-domain/dtos/SearchDeclarationDTO";

const useCase = new GetDeclarationStats(declarationSearchRepo);

/**
 * Server side direct stats getter for declarations in database.
 *
 * @deprecated convert to server action instead
 */
export const getStats = async (input: GetDeclarationStatsInput) => {
  return useCase.execute({
    ...input,
  });
};
