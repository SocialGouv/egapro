import { publicStatsRepo } from "@api/core-domain/repo";
import { GetPublicStats } from "@api/core-domain/useCases/GetPublicStats";
import { type PublicStatsDTO } from "@common/core-domain/dtos/PublicStatsDTO";

export const getPublicStats = async (): Promise<PublicStatsDTO> => {
  const useCase = new GetPublicStats(publicStatsRepo);
  return useCase.execute(null as never);
};
