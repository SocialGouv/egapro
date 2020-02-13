import { StatsData } from "../model";
import { collection, KintoCollection } from "./kinto-api";

const kintoCollection: KintoCollection<StatsData> = collection<StatsData>(
  "indicators_datas"
);

const countParTrancheEffectif = async (trancheEffectifs: string) => {
  return kintoCollection.count(
    `data.declaration.formValidated=Valid&data.informations.trancheEffectifs=${encodeURI(
      trancheEffectifs
    )}`
  );
};

const get: () => Promise<StatsData> = async () => {
  const [count50a250, count251a999, count1000etPlus] = await Promise.all([
    countParTrancheEffectif("50 à 250"),
    countParTrancheEffectif("251 à 999"),
    countParTrancheEffectif("1000 et plus")
  ]);
  return {
    "1000 et plus": count1000etPlus,
    "251 à 999": count251a999,
    "50 à 250": count50a250
  };
};

export const statsDataRepository = {
  get
};
