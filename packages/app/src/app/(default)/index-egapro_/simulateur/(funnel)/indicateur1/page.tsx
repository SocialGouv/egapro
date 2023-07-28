import { CenteredContainer } from "@design-system";

import { TITLES } from "../titles";
import { Indic1Form } from "./Form";

const title = TITLES.indicateur1;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur1Page = () => {
  return (
    <>
      <CenteredContainer>
        <p>
          Les rémunérations annuelles moyennes des femmes et des hommes doivent être renseignées par catégorie de postes
          équivalents (soit par CSP, soit par niveau ou coefficient hiérarchique en application de la classification de
          branche ou d’une autre méthode de cotation des postes après consultation du CSE) et par tranche d’âge.
        </p>
      </CenteredContainer>
      <Indic1Form />
    </>
  );
};

export default Indicateur1Page;
