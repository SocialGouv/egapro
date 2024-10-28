"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import { storePicker } from "@common/utils/zustand";
import { Box, Grid, GridCol } from "@design-system";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { redirect } from "next/navigation";
import { useState } from "react";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../(funnel)/useRepeqFunnelStore";
import { sendRepresentationEquilibreeReceipt } from "../actions";

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
    <Box my="8w">
      <Grid haveGutters>
        <GridCol md={6}>
          <Card
            horizontal
            title="Vous n'avez pas reçu l’accusé de réception"
            footer={
              <Button onClick={sendReceipt} disabled={receiptProcessing}>
                {receiptProcessing ? "Accusé en cours d'envoi ..." : "Renvoyer l'accusé de réception"}
              </Button>
            }
          />
        </GridCol>
        <GridCol md={6}>
          <Card
            title="Vous souhaitez effectuer une nouvelle déclaration"
            footer={<Button onClick={initNewRepresentation}>Effectuer une nouvelle déclaration</Button>}
          />
        </GridCol>
      </Grid>
    </Box>
  );
};
