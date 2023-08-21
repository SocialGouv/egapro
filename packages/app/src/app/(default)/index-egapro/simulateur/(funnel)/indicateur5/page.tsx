import { CenteredContainer } from "@design-system";

import { TITLES } from "../navigation";
import { Indic5Form } from "./Form";

const title = TITLES.indicateur5;

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
        Renseigner le nombre de femmes et d'hommes parmi les 10 plus hautes rémunérations durant la période de
        référence.
      </p>
      <Indic5Form />
    </CenteredContainer>
  );
};

export default Indicateur5Page;
