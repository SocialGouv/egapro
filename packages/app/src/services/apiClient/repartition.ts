import useSWR from "swr";
import { fetcher } from "./fetcher";
import type { FormState } from "./useFormManager";
import { useUser } from "./useUser";
import type { RepartitionEquilibreeAPI } from "@common/models/repartition-equilibree";
import { buildRepartition } from "@common/models/repartition-equilibree";

export const putRepartitionEquilibree = async (data: FormState) => {
  const repartition = buildRepartition(data);
  const siren = repartition.entreprise.siren;
  const year = repartition.déclaration.année_indicateurs;
  const url = `/repartition-equilibree/${siren}/${year}`;

  return fetcher(url, {
    method: "PUT",
    body: JSON.stringify({
      déclarant: repartition.déclarant,
      déclaration: repartition.déclaration,
      entreprise: repartition.entreprise,
      indicateurs: { répartition_équilibrée: repartition.répartition_équilibrée },
    }),
  });
};

export const fetchRepartitionEquilibree = (siren: string, year: number) =>
  fetcher(`/repartition-equilibree/${siren}/${year}`);

export const fetchRepartitionEquilibreePdf = (siren: string, year: number) => {
  console.log("in fetcher");
  const pdf = fetcher(`/repartition-equilibree/${siren}/${year}/pdf`, {
    headers: {
      "Content-Type": "application/pdf",
    },
  });
  return pdf;
};
export const fetchRepartitionEquilibreeSendEmail = (siren: string, year: number) =>
  fetcher(`/repartition-equilibree/${siren}/${year}/receipt`, { method: "POST" });

export const useRepartitionEquilibree = (siren: string, year: number) => {
  const { isAuthenticated } = useUser();
  const { data: repeq, error } = useSWR<RepartitionEquilibreeAPI>(
    !siren || !year || !isAuthenticated ? null : `/repartition-equilibree/${siren}/${year}`,
    fetcher,
  );

  return { repeq, error };
};
