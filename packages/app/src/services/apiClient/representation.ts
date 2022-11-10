import { ApiError } from "next/dist/server/api-utils";
import useSWR from "swr";

import { fetcher } from "./fetcher";
import type { FormState } from "./useFormManager";
import { useUser } from "./useUser";
import { buildFormState, buildRepresentation } from "@common/models/representation-equilibree";
import type { RepresentationEquilibreeAPI } from "@common/models/representation-equilibree";

export const putRepresentationEquilibree = async (data: FormState) => {
  const representation = buildRepresentation(data);
  const siren = representation.entreprise.siren;
  const year = representation.déclaration.année_indicateurs;
  const url = `/representation-equilibree/${siren}/${year}`;

  return fetcher(url, {
    method: "PUT",
    body: JSON.stringify(representation),
  });
};

export const fetchRepresentationEquilibree = (siren: string, year: number) =>
  fetcher(`/representation-equilibree/${siren}/${year}`) as Promise<RepresentationEquilibreeAPI>;

export const fetchRepresentationEquilibreeSendEmail = (siren: string, year: number) =>
  fetcher(`/representation-equilibree/${siren}/${year}/receipt`, { method: "POST" });

export const useRepresentationEquilibree = (siren: string, year: number) => {
  const { isAuthenticated } = useUser();
  const {
    data: repeq,
    error,
    isValidating: loading,
  } = useSWR<RepresentationEquilibreeAPI>(
    !siren || !year || !isAuthenticated ? null : `/representation-equilibree/${siren}/${year}`,
  );

  return { repeq, error, loading };
};

// Helper over fetchRepresentationEquilibree to manage 404 error as a regular case & transform in a FormState.
export const fetchRepresentationEquilibreeAsFormState = async (siren: string, year: number) => {
  try {
    const repeq = await fetchRepresentationEquilibree(siren, year);
    return buildFormState(repeq.data);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      // We can safely ignore this error, because this is the normal case.
      return undefined;
    } else {
      throw error;
    }
  }
};
