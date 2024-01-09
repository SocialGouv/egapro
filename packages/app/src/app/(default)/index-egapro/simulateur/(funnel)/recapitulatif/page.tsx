import { CenteredContainer } from "@design-system";

import { TITLES } from "../navigation";
import { RecapSimu } from "./RecapSimu";

const title = TITLES.recapitulatif;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur5Page = () => {
  return (
    <CenteredContainer mb="4w">
      <p>
        Le calcul de vos indicateurs et de votre index est terminé. Vous pouvez, si vous le souhaitez, transmettre les
        résultats obtenus aux services du ministre chargé du travail en renseignant les autres informations nécessaires
        à la déclaration en cliquant sur "Poursuivre vers la déclaration" ci-dessous.
      </p>
      <RecapSimu />
    </CenteredContainer>
  );
};

export default Indicateur5Page;
