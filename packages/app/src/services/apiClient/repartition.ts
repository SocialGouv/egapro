import { fetcher } from "./fetcher";
import type { FormState } from "./useFormManager";
import { buildRepartition } from "@common/models/repartition-equilibree";

export const putRepartition = (data: FormState) => {
  const repartition = buildRepartition(data);
  const siren: string = repartition.entreprise.siren;
  const year: number = repartition.déclaration.année_indicateurs;
  const url = `/repartition-equilibree/${siren}/${year}`;
  console.log("répartition for PUT:", repartition);
  fetcher(url, {
    method: "PUT",
    body: JSON.stringify({
      déclarant: repartition.déclarant,
      déclaration: repartition.déclaration,
      entreprise: repartition.entreprise,
      indicateurs: { répartition_équilibrée: repartition.répartition_équilibrée },
    }),
  });
};
