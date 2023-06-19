"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { storePicker } from "@common/utils/zustand";
import { add, isAfter } from "date-fns";
import { useEffect, useState } from "react";

import { getRepresentationEquilibree } from "../actions";
import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "./useRepeqFunnelStore";

const useStore = storePicker(useRepeqFunnelStore);
export const AlertEdition = () => {
  const [funnel, isEdit] = useStore("funnel", "isEdit");
  const hydrated = useRepeqFunnelStoreHasHydrated();
  const [repEq, setRepEq] = useState<RepresentationEquilibreeDTO | null>();

  useEffect(() => {
    funnel?.siren && funnel.year && getRepresentationEquilibree(funnel.siren, funnel.year).then(setRepEq);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on init
  }, []);

  if (!hydrated || !isEdit || !repEq) return null;

  const olderThanOneYear = isAfter(new Date(), add(new Date(repEq.declaredAt), { years: 1 }));

  return (
    <Alert
      severity="warning"
      title="Attention"
      className={fr.cx("fr-mb-4w")}
      description={
        <>
          {olderThanOneYear
            ? "Cette déclaration a été validée et transmise, et elle n'est plus modifiable car le délai d'un an est écoulé."
            : "Vous êtes en train de modifier une déclaration validée et transmise. Vos modifications ne seront enregistrées que lorsque vous l'aurez à nouveau validée et transmise à la dernière étape."}
          <br />
          <Button
            linkProps={{ href: `/representation-equilibree/${repEq.siren}/${repEq.year}` }}
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
            className={fr.cx("fr-mt-2w")}
          >
            Revenir au récapitulatif
          </Button>
        </>
      }
    />
  );
};
