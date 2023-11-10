"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { ResultatGlobalForm } from "./ResultatGlobalForm";

const stepName: FunnelKey = "resultat-global";

const ResultatGlobalPage = () => {
  return (
    <ClientOnly>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

      <ResultatGlobalForm />
    </ClientOnly>
  );
};

export default ResultatGlobalPage;
