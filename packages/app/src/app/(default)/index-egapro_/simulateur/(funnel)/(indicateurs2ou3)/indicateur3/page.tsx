import { CenteredContainer } from "@design-system";

import { NAVIGATION } from "../../navigation";
import { Indic3Form } from "./Form";

const { title } = NAVIGATION.indicateur3;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur3Page = () => {
  return (
    <CenteredContainer pb="4w">
      <Indic3Form />
    </CenteredContainer>
  );
};

export default Indicateur3Page;
