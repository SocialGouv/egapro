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
    <CenteredContainer pb="4w">
      <EffectifsForm />
    </CenteredContainer>
  );
};

export default EffectifsPage;
