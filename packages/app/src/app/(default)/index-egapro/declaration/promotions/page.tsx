"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { PromotionsForm } from "./PromotionsForm";

const stepName: FunnelKey = "promotions";

const RemunerationResultatPage = () => {
  return (
    <ClientOnly>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

      <PromotionsForm />
    </ClientOnly>
  );
};

export default RemunerationResultatPage;
