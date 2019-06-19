import { IndicatorsData } from "../../model";
import { indicatorsDataRepository } from "../../repository";

const add = () => {
  const record: IndicatorsData = {
    data: {}
  };
  return indicatorsDataRepository.add(record);
};

const one = (id: string) => {
  return indicatorsDataRepository.one(id);
};

const update = (record: IndicatorsData) => {
  return indicatorsDataRepository.update(record);
};

export interface IndicatorsDataService {
  add: () => Promise<IndicatorsData>;
  one: (id: string) => Promise<IndicatorsData>;
  update: (record: IndicatorsData) => Promise<IndicatorsData>;
}

export const indicatorsDataService: IndicatorsDataService = {
  add,
  one,
  update
};
