"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { AugmentationsForm } from "./AugmentationsForm";

const stepName: FunnelKey = "augmentations";

const RemunerationResultatPage = () => {
  return (
    <ClientOnly>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

      <AugmentationsForm />
    </ClientOnly>
  );
};

export default RemunerationResultatPage;
