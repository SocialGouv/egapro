import { type FunnelKey } from "../../declarationFunnelConfiguration";
import { DeclarationStepper } from "../../DeclarationStepper";
import { RemunerationGenericForm } from "../RemunerationGenericForm";

const stepName: FunnelKey = "remunerations-csp";

const RemunerationCSPPage = () => {
  return (
    <>
      <DeclarationStepper stepName={stepName} />
      <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
      <h6>Ecarts de rémunération par CSP et tranche d'âge en % *</h6>
      <p>
        Il faut saisir les écarts de rémunération en % avant application du seuil de pertinence{" "}
        <strong>uniquement pour les CSP et tranches d'âge pris en compte pour le calcul</strong> (zéro signifiant qu'il
        n'y a pas d'écart entre les femmes et les hommes). Un écart positif est à la faveur des hommes et un écart
        négatif est à la faveur des femmes.
      </p>
      <p>
        Si vous avez choisi de regrouper 2 ou 3 CSP, en cohérence avec les échelons prévus par votre convention
        collective de branche, pour le calcul de cet indicateur (par exemple, les CSP Ouvriers et Employés), vous devez
        renseigner les écarts de rémunération par défaut dans l’une des CSP concernées par le regroupement ci-dessous
        (en reprenant l’exemple, renseigner les écarts du groupe rassemblant les CSP Ouvriers et Employés soit dans la
        CSP Ouvriers ou soit dans la CSP Employés).
      </p>

      <RemunerationGenericForm mode="csp" />
    </>
  );
};

export default RemunerationCSPPage;
