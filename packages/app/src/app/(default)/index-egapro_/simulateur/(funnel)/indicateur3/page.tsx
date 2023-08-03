import { CenteredContainer } from "@design-system";

import { NAVIGATION } from "../navigation";
// import { Indic1Form } from "./Form";

const { title } = NAVIGATION.indicateur3;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur3Page = () => {
  return (
    <>
      <CenteredContainer>
        <p>
          Indicateur 3 : <strong>écart de taux de promotion</strong>
        </p>
      </CenteredContainer>
      {/* <Indic1Form /> */}
    </>
  );
};

export default Indicateur3Page;
