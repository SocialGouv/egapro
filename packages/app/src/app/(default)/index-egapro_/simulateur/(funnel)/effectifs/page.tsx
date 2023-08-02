import { CenteredContainer } from "@design-system";

import { NAVIGATION } from "../navigation";
import { EffectifsForm } from "./Form";

const { title } = NAVIGATION.effectifs;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const EffectifsPage = () => {
  return (
    <CenteredContainer>
      <EffectifsForm />
    </CenteredContainer>
  );
};

export default EffectifsPage;
