import moize from "moize";

import { fetcher } from "@common/utils/fetcher";

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

export const fetchSiren = async (siren: string, year?: number | undefined) => {
  const url = year ? `/validate-siren?siren=${siren}&year=${year}` : `/validate-siren?siren=${siren}`;

  const entreprise = await fetcher<EntrepriseType>(url);
  return { ...entreprise, siren };
};

type OwnersType = { owners?: string[] };

/**
 * Return the owners of the given siren. This endpoint returns only if the user is granted.
 * Otherwise, it returns an error.
 *
 * @param {*} siren
 * @returns { owners: string[] }
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

const NOT_ALLOWED_MESSAGE = "L'email saisi n'est pas rattaché au Siren de votre entreprise.";

const UNKNOWN_SIREN =
  "Ce SIREN n'existe pas, veuillez vérifier votre saisie, sinon veuillez contacter votre référent de l'égalité professionnelle.";

const CLOSED_SIREN = "Le SIREN saisi correspond à une entreprise fermée, veuillez vérifier votre saisie.";

const INVALID_SIREN = "Le SIREN est invalide.";

const FOREIGN_SIREN = "Le SIREN saisi correspond à une entreprise étrangère.";

export async function checkSiren(siren: string, year: number) {
  try {
    return memoizedValidateSiren(siren, year);
  } catch (error: any) {
    console.error(error?.response?.status, error);

    if (error?.response?.status === 404) {
      if (/Le Siren saisi correspond à une entreprise fermée/i.test(error?.jsonBody?.error)) {
        throw new Error(CLOSED_SIREN);
      }
      throw new Error(UNKNOWN_SIREN);
    }

    if (
      error?.response?.status === 422 &&
      /Le Siren saisi correspond à une entreprise étrangère/i.test(error?.jsonBody?.error)
    ) {
      throw new Error(FOREIGN_SIREN);
    }

    throw new Error(INVALID_SIREN);
  }
}

export const checkSirenWithOwner = async (siren: string, year: number) => {
  let result;

  try {
    result = await checkSiren(siren, year);
  } catch (error: unknown) {
    return (error as Error).message;
  }

  try {
    await ownersForSiren(siren);
  } catch (error) {
    console.error(error);

    return NOT_ALLOWED_MESSAGE;
  }

  return result;
};
