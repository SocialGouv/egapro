"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { ResultatGlobalForm } from "./ResultatGlobalForm";

const stepName: FunnelKey = "hautes-remunerations";

const ResultatGlobalPage = () => {
  return (
    <ClientOnly>
      <DeclarationStepper stepName={stepName} />

      <ResultatGlobalForm />
    </ClientOnly>
  );
};

export default ResultatGlobalPage;
