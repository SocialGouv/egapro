"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Card from "@codegouvfr/react-dsfr/Card";
import { storePicker } from "@common/utils/zustand";
import { Container, Grid, GridCol } from "@design-system";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../(funnel)/useRepeqFunnelStore";
import style from "./style.module.css";

const useStore = storePicker(useRepeqFunnelStore);
export const SendReceipt = () => {
  const router = useRouter();
  const [funnel, resetFunnel] = useStore("funnel", "resetFunnel");
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  const hydrated = useRepeqFunnelStoreHasHydrated();

  if (!hydrated) {
    return <Skeleton />;
  }

  if (!funnel?.siren || !funnel.year) {
    redirect("/representation-equilibree/commencer");
  }

  const initNewRepresentation = () => {
    resetFunnel();
    router.push("/representation-equilibree/commencer");
  };

  const sendReceipt = () => {
    setReceiptProcessing(true);
    // fetchRepresentationEquilibreeSendEmail(formData.entreprise.siren, formData.year).finally(() =>
    //   setReceiptProcessing(false),
    // );
  };
  return (
    <Container as="section">
      <Grid haveGutters align="center">
        <GridCol sm={10}>
          <ButtonsGroup
            inlineLayoutWhen="sm and up"
            buttonsEquisized
            alignment="center"
            buttons={[
              {
                children: receiptProcessing ? "Accusé en cours d'envoi ..." : "Renvoyer l'accusé de réception",
                priority: "secondary",
                onClick: sendReceipt,
                disabled: receiptProcessing,
              },
              {
                children: "Effectuer une nouvelle déclaration",
                onClick: initNewRepresentation,
              },
            ]}
          />
          <Card
            enlargeLink
            title="Télécharger le récapitulatif"
            endDetail="PDF"
            linkProps={{
              href: `/representation-equilibree/${funnel.siren}/${funnel.year}/pdf`,
            }}
            desc={`Année ${funnel.year + 1} au titre des donées ${funnel.year}`}
            iconId="fr-icon-download-line"
            className={style["download-icon"]}
          />
        </GridCol>
      </Grid>
    </Container>
  );
};
