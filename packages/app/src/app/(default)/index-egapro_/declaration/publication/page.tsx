"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { PublicationForm } from "./PublicationForm";

const stepName: FunnelKey = "publication";

const ResultatGlobalPage = () => {
  return (
    <ClientOnly>
      <DeclarationStepper stepName={stepName} />

      <p>
        L'index obtenu et les résultats obtenus à chaque indicateur sont publiés annuellement, au plus tard le 1er mars
        de l’année en cours, au titre de l’année précédente, de manière visible et lisible, sur le site Internet de
        l’entreprise lorsqu’il en existe un. A défaut de site Internet, ils sont portés à la connaissance des salariés
        par tout moyen.
      </p>

      <PublicationForm />
    </ClientOnly>
  );
};

export default ResultatGlobalPage;
