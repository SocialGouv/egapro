import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";

import { type FunnelKey } from "../../../declarationFunnelConfiguration";
import { DeclarationStepper } from "../../DeclarationStepper";
import { RemunerationGenericForm } from "../RemunerationGenericForm";

const stepName: FunnelKey = "remunerations-coefficient-autre";

const RemunerationCoefficientAutrePage = () => {
  return (
    <>
      <DeclarationStepper stepName={stepName} />

      <p>
        Il faut saisir les écarts de rémunération en % avant application du seuil de pertinence uniquement pour les
        niveaux ou coefficients et tranches d'âge pris en compte pour le calcul (zéro signifiant qu'il n'y a pas d'écart
        entre les femmes et les hommes). Un écart positif est à la faveur des hommes et un écart négatif est à la faveur
        des femmes.
      </p>

      <RemunerationGenericForm mode={RemunerationsMode.Enum.OTHER_LEVEL} />
    </>
  );
};

export default RemunerationCoefficientAutrePage;
