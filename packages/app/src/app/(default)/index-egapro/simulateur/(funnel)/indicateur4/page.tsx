import Alert from "@codegouvfr/react-dsfr/Alert";
import { CenteredContainer, Link } from "@design-system";

import { TITLES } from "../navigation";
import { Indic4Form } from "./Form";

const title = TITLES.indicateur4;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur4Page = () => {
  return (
    <CenteredContainer mb="4w">
      <Alert
        className="fr-mb-4w"
        title="Aide au calcul"
        severity="info"
        description={
          <>
            Est prise en compte une salariée qui est revenue de congé maternité (ou d'adoption, et éventuellement
            prolongé par un congé parental) au cours de la période de référence annuelle considérée si au moins une
            augmentation a été faite pendant son congé. La prise en compte de chaque salariée est donc appréciée
            individuellement et dépend des éventuelles augmentations ayant eu lieu pendant leur congé maternité (ou
            d'adoption).
            <br />
            L’indicateur n’est pas calculable si aucun retour de congé maternité (ou d'adoption) n’est intervenu au
            cours de la période de référence ou si aucune augmentation n’est intervenue durant la durée du ou des congés
            maternité (ou d'adoption).
            <br />
            Pour en savoir plus sur le calcul de cet indicateur,{" "}
            <Link
              target="_blank"
              href="/aide-index#indicateur-pourcentage-de-salariees-augment-es-dans-l-ann-e-suivant-leur-retour-de-cong-maternite"
            >
              cliquez ici
            </Link>
          </>
        }
      />
      <Indic4Form />
    </CenteredContainer>
  );
};

export default Indicateur4Page;
