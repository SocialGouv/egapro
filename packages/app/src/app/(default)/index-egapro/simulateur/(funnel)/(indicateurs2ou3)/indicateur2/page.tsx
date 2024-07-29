import { CenteredContainer } from "@design-system";

import { NAVIGATION } from "../../navigation";
import { Indic2or3Form } from "../Form";

const { title } = NAVIGATION.indicateur2;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur2Page = () => {
  return (
    <CenteredContainer pb="4w">
      <Indic2or3Form indicateur={2} />
    </CenteredContainer>
  );
};

export default Indicateur2Page;
