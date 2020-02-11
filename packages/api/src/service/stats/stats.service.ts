import { StatsData } from "../../model";
import { statsDataRepository } from "../../repository";

const get = () => {
  return statsDataRepository.get();
};

export interface statsDataService {
  get: () => Promise<StatsData>;
}

export const statsDataService: statsDataService = {
  get
};
