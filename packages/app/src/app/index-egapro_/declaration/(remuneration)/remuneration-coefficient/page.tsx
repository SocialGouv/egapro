import { RemunerationGenericForm } from "../RemunerationGenericForm";
import { ClientStepper } from "./ClientStepper";

const RemunerationCoefficientPage = () => {
  return (
    <>
      <ClientStepper />

      <p>
        Il faut saisir les écarts de rémunération en % avant application du seuil de pertinence uniquement pour les
        niveaux ou coefficients et tranches d'âge pris en compte pour le calcul (zéro signifiant qu'il n'y a pas d'écart
        entre les femmes et les hommes). Un écart positif est à la faveur des hommes et un écart négatif est à la faveur
        des femmes.
      </p>

      <RemunerationGenericForm mode="coefficient" />
    </>
  );
};

export default RemunerationCoefficientPage;
