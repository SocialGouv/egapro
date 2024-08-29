"use client";

import { ClientOnly } from "@components/utils/ClientOnly";

import { AlertExistingDeclaration } from "../AlertExistingDeclaration";
import { type FunnelKey } from "../declarationFunnelConfiguration";
import { DeclarationStepper } from "../DeclarationStepper";
import { PublicationForm } from "./PublicationForm";

const stepName: FunnelKey = "publication";

const ResultatGlobalPage = () => {
  return (
    <ClientOnly>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />

      <p>
        La note obtenue à l’index ainsi que celle obtenue à chacun des indicateurs doivent être{" "}
        <strong>publiés de manière visible et lisible sur le site internet de l’entreprise</strong>, chaque année au
        plus tard le 1er mars, et devront rester en ligne au moins jusqu’à la publication des résultats l’année
        suivante.
        <br /> En l’absence de site internet (au niveau de l’entreprise, du groupe ou de l’unité économique et sociale),
        l’index et ses indicateurs doivent être communiqués aux salariés par tout moyen (courrier papier ou
        électronique, affichage…).
      </p>

      <PublicationForm />
    </ClientOnly>
  );
};

export default ResultatGlobalPage;
