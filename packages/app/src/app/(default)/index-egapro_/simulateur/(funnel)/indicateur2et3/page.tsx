import Alert from "@codegouvfr/react-dsfr/Alert";
import { CenteredContainer } from "@design-system";

import { NAVIGATION } from "../navigation";
import { Indic2and3Form } from "./Form";

const { title } = NAVIGATION.indicateur2et3;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur2et3Page = () => {
  return (
    <CenteredContainer pb="4w">
      <p>
        Renseigner le nombre de femmes et d'hommes ayant été augmentés durant la période de référence. Il s'agit des
        augmentations individuelles du salaire de base, y compris celles liées à une promotion.
      </p>
      <Alert
        className="fr-mb-3w"
        small
        severity="info"
        description="La période choisie pour le calcul de cet indicateur peut correspondre à la période de référence annuelle, ou inclure la ou les deux années précédentes. Si une période pluriannuelle est choisie, elle peut être révisée tous les trois ans."
      />
      <Indic2and3Form />
    </CenteredContainer>
  );
};

export default Indicateur2et3Page;
