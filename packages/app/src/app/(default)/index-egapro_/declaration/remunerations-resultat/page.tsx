"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { RemunerationCSPResultatForm } from "./RemunerationCSPResultatForm";

const stepName: FunnelKey = "remunerations-resultat";

const RemunerationResultatPage = () => {
  return (
    <ClientOnly>
      <DeclarationStepper stepName={stepName} />

      <RemunerationCSPResultatForm />
    </ClientOnly>
  );
};

export default RemunerationResultatPage;
