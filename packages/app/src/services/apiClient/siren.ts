import { type DeclarationDTO } from "@common/models/generated";
import { type Any } from "@common/utils/types";
import moize from "moize";

import { fetcher } from "./fetcher";

export type EntrepriseType = DeclarationDTO["entreprise"];

type Entreprise = Any;

export const formatAdresse = (entreprise: Entreprise | EntrepriseType) => {
  return [entreprise.adresse, entreprise.code_postal, entreprise.commune];
};

// TODO: faire un useCase validateSiren qui va appeller l'API et vérifier que la date de cessation est correcte.

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

export const memoizedFetchSiren = moize(moizeConfig)(fetchSiren);

export const checkSiren = async (siren: string, year: number) => {
  try {
    return await memoizedFetchSiren(siren, year);
  } catch (error: unknown) {
    console.error(error);

    throw new Error(error instanceof Error ? error.message : "Erreur dans checkSiren");
  }
};
