"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { HautesRémunérationsForm } from "./HautesRémunérationsForm";

const stepName: FunnelKey = "hautes-remunerations";

const AugmentationEtPromotionsPage = () => {
  return (
    <ClientOnly>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

      <HautesRémunérationsForm />
    </ClientOnly>
  );
};

export default AugmentationEtPromotionsPage;
