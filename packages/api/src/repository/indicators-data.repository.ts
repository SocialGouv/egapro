import { IndicatorsData } from "../model";
import { collection, KintoCollection } from "./kinto-api";

const kintoCollection: KintoCollection<IndicatorsData> = collection<
  IndicatorsData
>("indicators_datas");

const add: (record: IndicatorsData) => Promise<IndicatorsData> = async (
  record: IndicatorsData
) => {
  const kintoResult = await kintoCollection.add(record);
  return kintoResult.data;
};

const one: (id: string) => Promise<IndicatorsData> = async (id: string) => {
  const kintoResult = await kintoCollection.one(id);
  return kintoResult.data;
};

const update: (record: IndicatorsData) => Promise<IndicatorsData> = async (
  record: IndicatorsData
) => {
  if (!record.id) {
    throw new Error("Try to update a record without id");
  }
  const kintoResult = await kintoCollection.update(record.id, record);
  return kintoResult.data;
};

export const indicatorsDataRepository = {
  add,
  one,
  update
};
