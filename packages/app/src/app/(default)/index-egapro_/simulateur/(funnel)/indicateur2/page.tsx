import { CenteredContainer } from "@design-system";

import { NAVIGATION } from "../navigation";
// import { Indic1Form } from "./Form";

const { title } = NAVIGATION.indicateur2;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur2Page = () => {
  return (
    <>
      <CenteredContainer>
        <p>
          Renseigner le nombre de femmes et d'hommes ayant été augmentés durant la période de référence. Il s'agit des
          augmentations individuelles du salaire de base, y compris celles liées à une promotion.
        </p>
      </CenteredContainer>
      {/* <Indic1Form /> */}
    </>
  );
};

export default Indicateur2Page;
