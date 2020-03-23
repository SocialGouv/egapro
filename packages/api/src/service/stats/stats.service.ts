import { StatsData } from "../../model";
import { statsDataRepository } from "../../repository";

const get = () => {
  return statsDataRepository.get();
};

export interface StatsDataService {
  get: () => Promise<StatsData>;
}

export const statsDataService: StatsDataService = {
  get,
};
