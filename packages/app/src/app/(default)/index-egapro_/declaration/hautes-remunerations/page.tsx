"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { HautesRémunérationsForm } from "./HautesRémunérationsForm";

const stepName: FunnelKey = "hautes-remunerations";

const AugmentationEtPromotionsPage = () => {
  return (
    <ClientOnly>
      <DeclarationStepper stepName={stepName} />

      <HautesRémunérationsForm />
    </ClientOnly>
  );
};

export default AugmentationEtPromotionsPage;
