import moize from "moize";

import { fetcher } from "./fetcher";
import type { Entreprise } from "@common/models/representation-equilibree";

export type EntrepriseType = {
  adresse?: string;
  code_naf?: string;
  code_pays?: string;
  code_postal?: string;
  commune?: string;
  département?: string;
  raison_sociale?: string;
  région?: string;
  siren?: string;
};

export const formatAdresse = (entreprise: Entreprise | EntrepriseType) => {
  return [entreprise.adresse, entreprise.code_postal, entreprise.commune];
};

export const fetchSiren = async (siren: string, year?: number | undefined) => {
  const url = year ? `/validate-siren?siren=${siren}&year=${year}` : `/validate-siren?siren=${siren}`;

  const entreprise = await fetcher<EntrepriseType>(url);
  return { ...entreprise, siren };
};

type OwnersType = { owners?: string[] };

/**
 * Return the owners of the given siren. This endpoint returns only if the user is granted.
 * Otherwise, it returns an error.
 */
export const ownersForSiren = async (siren: string) => {
  return fetcher<OwnersType>(`/ownership/${siren}`);
};

const moizeConfig = {
  maxSize: 1000,
  maxAge: 1000 * 60 * 60, // 1 hour
  isPromise: true,
};

const memoizedValidateSiren = moize(moizeConfig)(fetchSiren);

export const checkSiren = async (siren: string, year: number) => {
  try {
    return await memoizedValidateSiren(siren, year);
  } catch (error: unknown) {
    console.error(error);

    throw new Error(error instanceof Error ? error.message : "Erreur dans checkSiren");
  }
};
