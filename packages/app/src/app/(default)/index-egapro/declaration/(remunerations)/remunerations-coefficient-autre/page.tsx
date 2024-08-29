import { type FunnelKey } from "../../declarationFunnelConfiguration";
import { DeclarationStepper } from "../../DeclarationStepper";
import { RemunerationGenericForm } from "../RemunerationGenericForm";

const stepName: FunnelKey = "remunerations-coefficient-autre";

const RemunerationCoefficientAutrePage = () => {
  return (
    <>
      <DeclarationStepper stepName={stepName} />
      <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
      <h6>Ecarts de rémunération par niveau ou coefficient et tranche d'âge en % *</h6>
      <p>
        Il faut saisir les écarts de rémunération en % avant application du seuil de pertinence{" "}
        <strong>uniquement pour les niveaux ou coefficients et tranches d'âge pris en compte pour le calcul</strong>{" "}
        (zéro signifiant qu'il n'y a pas d'écart entre les femmes et les hommes). Un écart positif est à la faveur des
        hommes et un écart négatif est à la faveur des femmes.
      </p>

      <RemunerationGenericForm mode="niveau_autre" />
    </>
  );
};

export default RemunerationCoefficientAutrePage;
