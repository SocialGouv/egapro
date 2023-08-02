"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { useHasMounted } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { Container, Grid, GridCol } from "@design-system";
import { resendReceipt } from "@services/apiClient/declaration";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { funnelStaticConfig } from "../declarationFunnelConfiguration";
import style from "./style.module.css";

export const SendReceipt = () => {
  const router = useRouter();
  const { formData, resetFormData } = useDeclarationFormManager();
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  const hasMounted = useHasMounted();

  if (formData.commencer?.annéeIndicateurs === undefined || formData.commencer?.siren === undefined)
    throw new Error("Impossible de récupérer les données de l'entreprise");

  const année = Number(formData.commencer.annéeIndicateurs);
  const siren = formData.commencer.siren;

  if (!hasMounted) {
    return <SkeletonForm fields={3} />;
  }

  const initNewDeclaration = () => {
    resetFormData();
    router.push(funnelStaticConfig["commencer"].url);
  };

  const sendReceipt = () => {
    if (!siren || !année) {
      return;
    }

    setReceiptProcessing(true);
    resendReceipt(siren, année).finally(() => {
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
