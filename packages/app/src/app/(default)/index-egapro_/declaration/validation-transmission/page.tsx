"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { RecapFunnel } from "./RecapFunnel";

const stepName: FunnelKey = "validation-transmission";

const ResultatGlobalPage = () => {
  return (
    <ClientOnly>
      <DeclarationStepper stepName={stepName} />

      <p>
        Vous êtes sur le point de valider la procédure vous permettant de transmettre aux services du ministre chargé du
        travail vos résultats en matière d’écart de rémunération entre les femmes et les hommes conformément aux
        dispositions de l’article D.1142-5 du code du travail. Pour terminer la procédure, cliquez sur “Valider et
        transmettre les résultats” ci-dessous. Vous recevrez un accusé de réception.
      </p>

      <RecapFunnel />
    </ClientOnly>
  );
};

export default ResultatGlobalPage;
