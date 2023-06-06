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
    <CenteredContainer>
      <h1>{title}</h1>
      <p>
        <strong>
          Les entreprises qui emploient au moins 1 000 salariés pour le troisième exercice consécutif doivent publier et
          déclarer chaque année
        </strong>{" "}
        au plus tard le 1er mars leurs écarts éventuels de représentation entre les femmes et les hommes parmi, d’une
        part, leurs cadres dirigeants, et d’autre part, les membres de leurs instances dirigeantes, en parallèle de la
        publication et de la déclaration de leur Index de l’égalité professionnelle.
      </p>

      <AssujettiForm title={title} />
    </CenteredContainer>
  );
};

export default AssujettiPage;
