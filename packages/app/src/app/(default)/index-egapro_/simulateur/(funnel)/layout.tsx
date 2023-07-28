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

const SimulateurFunnelLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <CenteredContainer>
        <Stepper />
      </CenteredContainer>
      {children}
    </>
  );
};

export default SimulateurFunnelLayout;
