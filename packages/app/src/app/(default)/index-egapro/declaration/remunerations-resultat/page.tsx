"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { RemunerationResultatForm } from "./RemunerationResultatForm";

const stepName: FunnelKey = "remunerations-resultat";

const RemunerationResultatPage = () => {
  return (
    <ClientOnly>
      <DeclarationStepper stepName={stepName} />

      <RemunerationResultatForm />
    </ClientOnly>
  );
};

export default RemunerationResultatPage;
