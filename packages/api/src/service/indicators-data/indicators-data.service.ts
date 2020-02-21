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

const find = (partialCompanyName: string) => {
  return indicatorsDataRepository.find(
    `data.declaration.formValidated=Valid&like_data.informationsEntreprise.nomEntreprise=${encodeURIComponent(
      partialCompanyName
    )}&_limit=25`
  );
};

export interface IndicatorsDataService {
  add: () => Promise<IndicatorsData>;
  find: (partialCompanyName: string) => Promise<IndicatorsData>;
  one: (id: string) => Promise<IndicatorsData>;
  update: (record: IndicatorsData) => Promise<IndicatorsData>;
}

export const indicatorsDataService: IndicatorsDataService = {
  add,
  find,
  one,
  update
};
