import { AlertExistingDeclaration } from "../../AlertExistingDeclaration";
import { type FunnelKey } from "../../declarationFunnelConfiguration";
import { DeclarationStepper } from "../../DeclarationStepper";
import { RemunerationGenericForm } from "../RemunerationGenericForm";

const stepName: FunnelKey = "remunerations-coefficient-branche";

const RemunerationCoefficientBranchePage = () => {
  return (
    <>
      <AlertExistingDeclaration />
      <DeclarationStepper stepName={stepName} />
      <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
      <h4>Ecarts de rémunération par niveau ou coefficient et tranche d'âge en % *</h4>
      <p>
        Il faut saisir les écarts de rémunération en % avant application du seuil de pertinence uniquement pour les
        niveaux ou coefficients et tranches d'âge pris en compte pour le calcul (zéro signifiant qu'il n'y a pas d'écart
        entre les femmes et les hommes). Un écart positif est à la faveur des hommes et un écart négatif est à la faveur
        des femmes.
      </p>

      <RemunerationGenericForm mode="niveau_branche" />
    </>
  );
};

export default RemunerationCoefficientBranchePage;
