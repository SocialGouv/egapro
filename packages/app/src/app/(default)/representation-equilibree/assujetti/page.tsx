import { CenteredContainer } from "@design-system";

import { AssujettiForm } from "./Form";

const title = "Êtes-vous assujetti ?";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const AssujettiPage = async () => {
  return (
    <CenteredContainer pb="6w">
      <h1>{title}</h1>
      <p>
        Les entreprises qui emploient au moins 1000 salariés pour le troisième exercice consécutif doivent calculer,
        publier et déclarer chaque année au plus tard le 1er mars leurs écarts éventuels de représentation entre les
        femmes et les hommes parmi leurs cadres dirigeants et les membres de leurs instances dirigeantes.
      </p>

      <AssujettiForm title={title} />
    </CenteredContainer>
  );
};

export default AssujettiPage;
