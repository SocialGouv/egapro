"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { useHasMounted } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { Container, Grid, GridCol } from "@design-system";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useState } from "react";

import { sendDeclarationReceipt } from "../actions";
import style from "./style.module.css";

export const SendReceiptInitButtons = () => {
  const { formData, resetFormData } = useDeclarationFormManager();
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  const hasMounted = useHasMounted();

  if (formData.commencer?.annéeIndicateurs === undefined || formData.commencer?.siren === undefined) return null;

  const année = Number(formData.commencer.annéeIndicateurs);
  const siren = formData.commencer.siren;

  if (!hasMounted) {
    return <SkeletonForm fields={3} />;
  }

  const initNewDeclaration = () => {
    resetFormData();
  };

  const sendReceipt = () => {
    if (!siren || !année) {
      return;
    }

    setReceiptProcessing(true);

    sendDeclarationReceipt(siren, année).finally(() => {
      setReceiptProcessing(false);
    });
  };

  return (
    <>
      <Container as="section">
        <Grid align="center" haveGutters>
          <GridCol md={5}>
            <Button
              size="medium"
              className={style["send-receipt-button"]}
              priority="secondary"
              onClick={sendReceipt}
              disabled={receiptProcessing}
            >
              {receiptProcessing ? "Accusé en cours d'envoi ..." : "Renvoyer l'accusé de réception"}
            </Button>
          </GridCol>
          <GridCol md={5}>
            <Button
              size="medium"
              priority="secondary"
              className={style["send-receipt-button"]}
              onClick={initNewDeclaration}
            >
              Effectuer une nouvelle déclaration
            </Button>
          </GridCol>
        </Grid>
      </Container>
    </>
  );
};
