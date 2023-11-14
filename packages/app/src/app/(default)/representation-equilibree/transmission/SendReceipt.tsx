"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { storePicker } from "@common/utils/zustand";
import { Container, DownloadCard, Grid, GridCol } from "@design-system";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { redirect } from "next/navigation";
import { useState } from "react";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../(funnel)/useRepeqFunnelStore";
import { sendRepresentationEquilibreeReceipt } from "../actions";
import style from "./style.module.css";

const useStore = storePicker(useRepeqFunnelStore);
export const SendReceipt = () => {
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
            <DownloadCard
              title="Télécharger le récapitulatif"
              endDetail="PDF"
              href={`/representation-equilibree/${funnel.siren}/${funnel.year}/pdf`}
              filename={`representation_${funnel.siren}_${funnel.year + 1}.pdf`}
              fileType="application/pdf"
              desc={`Année ${funnel.year + 1} au titre des données ${funnel.year}`}
            />
          </GridCol>
        </Grid>
      </Container>
    </>
  );
};
