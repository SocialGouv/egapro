import { CenteredContainer } from "@design-system";
import { type PropsWithChildren } from "react";

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
  // stepper
  return <CenteredContainer>{children}</CenteredContainer>;
};

export default RepEqFunnelLayout;
