"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { storePicker } from "@common/utils/zustand";
import { add, isAfter } from "date-fns";
import { useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useState } from "react";

import { getRepresentationEquilibree } from "../actions";
import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "./useRepeqFunnelStore";

const useStore = storePicker(useRepeqFunnelStore);
export const AlertEdition = () => {
  const [funnel, isEdit] = useStore("funnel", "isEdit");
  const hydrated = useRepeqFunnelStoreHasHydrated();
  const [repEq, setRepEq] = useState<RepresentationEquilibreeDTO | null>();
  const segment = useSelectedLayoutSegment();

  useEffect(() => {
    funnel?.siren && funnel.year && getRepresentationEquilibree(funnel.siren, funnel.year).then(setRepEq);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on init
  }, []);

  if (!hydrated || !isEdit || !repEq) return null;

  const olderThanOneYear = isAfter(new Date(), add(new Date(repEq.declaredAt), { years: 1 }));
  if (segment === "commencer") return null;
  return (
    <Alert
      severity="info"
      title="Attention"
      className={fr.cx("fr-mb-4w")}
      description={
        <>
          {olderThanOneYear
            ? "Cette déclaration a été validée et transmise, et elle n'est plus modifiable car le délai d'un an est écoulé."
            : "Vous êtes en train de modifier une déclaration validée et transmise. Vos modifications ne seront enregistrées que lorsque vous l'aurez à nouveau validée et transmise à la dernière étape."}
          <br />

          <ButtonsGroup
            inlineLayoutWhen="sm and up"
            alignment="right"
            buttons={[
              {
                title: "Revenir au récapitulatif",
                children: "Revenir au récapitulatif",
                linkProps: {
                  href: `/representation-equilibree/${repEq.siren}/${repEq.year}`,
                },
                iconId: "fr-icon-arrow-right-line",
                iconPosition: "right",
                className: fr.cx("fr-mt-2w"),
                priority: "tertiary",
              },
            ]}
          />
        </>
      }
    />
  );
};
