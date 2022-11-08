import type { RepresentationEquilibreeAPI } from "@common/models/representation-equilibree";
import { buildRepresentation } from "@common/models/representation-equilibree";
import useSWR from "swr";

import { fetcher } from "./fetcher";
import type { FormState } from "./useFormManager";
import { useUser } from "./useUser";

export const putRepresentationEquilibree = async (data: FormState) => {
  const representation = buildRepresentation(data);
  const siren = representation.entreprise.siren;
  const year = representation.déclaration.année_indicateurs;
  const url = `/representation-equilibree/${siren}/${year}`;

  return fetcher(url, {
    method: "PUT",
    body: JSON.stringify({
      déclarant: representation.déclarant,
      déclaration: representation.déclaration,
      entreprise: representation.entreprise,
      indicateurs: { représentation_équilibrée: representation.représentation_équilibrée },
    }),
  });
};

export const fetchRepresentationEquilibree = (siren: string, year: number) =>
  fetcher(`/representation-equilibree/${siren}/${year}`);

export const fetchRepresentationEquilibreeSendEmail = (siren: string, year: number) =>
  fetcher(`/representation-equilibree/${siren}/${year}/receipt`, { method: "POST" });

export const useRepresentationEquilibree = (siren: string, year: number) => {
  const { isAuthenticated } = useUser();
  const { data: repeq, error } = useSWR<RepresentationEquilibreeAPI>(
    !siren || !year || !isAuthenticated ? null : `/representation-equilibree/${siren}/${year}`,
  );

  return { repeq, error };
};
