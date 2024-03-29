"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { AugmentationEtPromotionsForm } from "./AugmentationsEtPromotionsForm";

const stepName: FunnelKey = "augmentations-et-promotions";

const AugmentationEtPromotionsPage = () => {
  return (
    <ClientOnly>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

      <AugmentationEtPromotionsForm />
    </ClientOnly>
  );
};

export default AugmentationEtPromotionsPage;
