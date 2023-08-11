import Alert from "@codegouvfr/react-dsfr/Alert";
import { CenteredContainer } from "@design-system";

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
      <p>
        Renseigner le nombre de salariées en congé maternité durant la période de référence et ayant reçu une
        augmentation à leur retour.
      </p>
      <Alert
        className="fr-mb-4w"
        title="Salariées considérées"
        severity="info"
        description={
          <>
            Est prise en compte une salariée qui est <u>revenue</u> de congé maternité (éventuellement prolongé par un
            congé parental) pendant la période de référence si au moins une augmentation a été faite pendant son congé.
            La prise en compte chaque salariée est donc appréciée individuellement et dépend des éventuelles
            augmentations ayant eu lieu pendant ses congés.
          </>
        }
      />
      <Indic4Form />
    </CenteredContainer>
  );
};

export default Indicateur4Page;
