"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import { storePicker } from "@common/utils/zustand";
import { Container, Grid, GridCol } from "@design-system";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../(funnel)/useRepeqFunnelStore";
import { sendRepresentationEquilibreeReceipt } from "../actions";
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
    if (!funnel.siren || !funnel.year) {
      return;
    }

    setReceiptProcessing(true);
    sendRepresentationEquilibreeReceipt(funnel.siren, funnel.year).finally(() => {
      setReceiptProcessing(false);
    });
  };

  return (
    <>
      <Container as="section">
        <Grid align="center" haveGutters>
          <GridCol md={5}>
            <Button
              size="small"
              className={style["send-receipt-button"]}
              priority="secondary"
              onClick={sendReceipt}
              disabled={receiptProcessing}
            >
              {receiptProcessing ? "Accusé en cours d'envoi ..." : "Renvoyer l'accusé de réception"}
            </Button>
          </GridCol>
          <GridCol md={5}>
            <Button size="small" className={style["send-receipt-button"]} onClick={initNewRepresentation}>
              Effectuer une nouvelle déclaration
            </Button>
          </GridCol>
          <GridCol md={10}>
            <Card
              enlargeLink
              title="Télécharger le récapitulatif"
              endDetail="PDF"
              linkProps={{
                href: `/representation-equilibree/${funnel.siren}/${funnel.year}/pdf`,
                download: `representation_${funnel.siren}_${funnel.year + 1}.pdf`,
                prefetch: false,
                replace: false,
                target: "_blank",
                type: "application/pdf",
                rel: "noopener noreferer",
              }}
              desc={`Année ${funnel.year + 1} au titre des donées ${funnel.year}`}
              iconId="fr-icon-download-line"
              className={style["download-icon"]}
            />
          </GridCol>
        </Grid>
      </Container>
    </>
  );
};
