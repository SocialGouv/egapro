import { CenteredContainer } from "@design-system";

import { NAVIGATION } from "../../navigation";
import { Indic2or3Form } from "../Form";

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
      <Indic2or3Form indicateur={3} />
    </CenteredContainer>
  );
};

export default Indicateur3Page;
