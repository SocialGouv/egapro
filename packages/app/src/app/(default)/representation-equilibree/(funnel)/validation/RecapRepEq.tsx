"use client";

import { type Entreprise } from "@api/core-domain/infra/services/IEntrepriseService";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import {
  type CreateRepresentationEquilibreeDTO,
  createRepresentationEquilibreeDTO,
} from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { SkeletonFlex } from "@components/utils/skeleton/SkeletonFlex";
import { RecapCard } from "@design-system";
import { times } from "lodash";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { type ZodError } from "zod";

import { getCompany, saveRepresentationEquilibree } from "../../actions";
import { DetailRepEq } from "../../Recap";
import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

function assertRepEq(
  repEq: Partial<CreateRepresentationEquilibreeDTO> | undefined,
): asserts repEq is CreateRepresentationEquilibreeDTO {
  createRepresentationEquilibreeDTO.parse(repEq);
}

export const ValidationRecapRepEq = () => {
  const router = useRouter();
  const [company, setCompany] = useState<Entreprise | null>(null);
  const { funnel, saveFunnel, resetFunnel, isEdit, setIsEdit } = useRepeqFunnelStore();
  const hydrated = useRepeqFunnelStoreHasHydrated();

  useEffect(() => {
    if (funnel?.siren && !company) getCompany(funnel.siren).then(setCompany);
  }, [funnel, company]);

  if (hydrated && !funnel?.siren) {
    return redirect("/representation-equilibree/commencer");
  }

  if (!hydrated || !company) {
    return (
      <>
        <p>
          Déclaration des écarts de représentation Femmes/Hommes pour l'année <Skeleton inline width="4ch" /> au titre
          des données <Skeleton inline width="4ch" /> .
        </p>
        {times(6).map(idx => (
          <RecapCard key={`recap-loading-${idx}`} title={<SkeletonFlex />} content={<Skeleton count={3} />} />
        ))}
      </>
    );
  }

  try {
    assertRepEq(funnel);
  } catch (e: unknown) {
    return <Alert severity="error" title="Données invalides" description={(e as ZodError).message} />;
  }

  const sendRepresentationEquilibree = async () => {
    await saveRepresentationEquilibree(funnel);
    setIsEdit(true);
    router.push("/representation-equilibree/transmission");
  };

  const previousPage =
    "notComputableReasonExecutives" in funnel && "notComputableReasonMembers" in funnel
      ? "/representation-equilibree/ecarts-membres"
      : "/representation-equilibree/publication";
  return (
    <>
      <p>
        Déclaration des écarts de représentation Femmes/Hommes pour l'année {funnel.year + 1} au titre des données{" "}
        {funnel.year}.
      </p>
      <DetailRepEq edit repEq={{ ...funnel, date: "" }} company={company} />
      <ButtonsGroup
        className={fr.cx("fr-mt-6w")}
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: "Précédent",
            priority: "secondary",
            linkProps: {
              href: previousPage,
            },
          },
          {
            children: "Valider et transmettre les résultats",
            onClick: sendRepresentationEquilibree,
          },
        ]}
      />
    </>
  );
};
