"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { CongesMaterniteForm } from "./CongesMaterniteForm";

const stepName: FunnelKey = "conges-maternite";

const AugmentationEtPromotionsPage = () => {
  return (
    <ClientOnly>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

      <CongesMaterniteForm />
    </ClientOnly>
  );
};

export default AugmentationEtPromotionsPage;
