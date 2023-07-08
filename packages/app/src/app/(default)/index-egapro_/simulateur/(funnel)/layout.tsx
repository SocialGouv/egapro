import { CenteredContainer } from "@design-system";
import { type PropsWithChildren } from "react";

import { Stepper } from "./Stepper";

const title = "Calcul d'index";

export const metadata = {
  title: {
    template: `%s - ${title}`,
    default: title,
  },
  openGraph: {
    title: {
      template: `%s - ${title}`,
      default: title,
    },
  },
  robots: "noindex, nofollow",
};

const RepEqFunnelLayout = ({ children }: PropsWithChildren) => {
  return (
    <CenteredContainer pb="6w">
      <Stepper />
      {children}
    </CenteredContainer>
  );
};

export default RepEqFunnelLayout;
