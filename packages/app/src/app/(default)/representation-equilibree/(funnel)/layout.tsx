import { CenteredContainer } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { type PropsWithChildren } from "react";

import { AlertEdition } from "./AlertEdition";
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
    <CenteredContainer pb="6w">
      <ClientAnimate>
        <AlertEdition />
      </ClientAnimate>
      <Stepper />
      {children}
    </CenteredContainer>
  );
};

export default RepEqFunnelLayout;
