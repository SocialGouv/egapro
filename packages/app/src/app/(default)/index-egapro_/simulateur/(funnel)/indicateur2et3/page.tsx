import { CenteredContainer } from "@design-system";

import { NAVIGATION } from "../navigation";
import { Indic2and3Form } from "./Form";
// import { Indic1Form } from "./Form";

const { title } = NAVIGATION.indicateur2et3;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur2et3Page = () => {
  return (
    <>
      <CenteredContainer>
        <p>
          Renseigner le nombre de femmes et d'hommes ayant été augmentés durant la période de référence. Il s'agit des
          augmentations individuelles du salaire de base, y compris celles liées à une promotion.
        </p>
      </CenteredContainer>
      <Indic2and3Form />
    </>
  );
};

export default Indicateur2et3Page;
