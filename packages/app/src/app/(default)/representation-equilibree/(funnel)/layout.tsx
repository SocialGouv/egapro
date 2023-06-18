import { CenteredContainer } from "@design-system";
import { type PropsWithChildren } from "react";

import { Stepper } from "./Stepper";

const title = "Représentation Équilibrée Egapro";

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
    <CenteredContainer>
      <Stepper />
      {children}
    </CenteredContainer>
  );
};

export default RepEqFunnelLayout;
