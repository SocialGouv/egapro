import { CenteredContainer } from "@design-system";
import { type PropsWithChildren } from "react";

const title = "Simulateur Index Egapro";

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

const SimuFunnelLayout = ({ children }: PropsWithChildren) => {
  // stepper
  return <CenteredContainer>{children}</CenteredContainer>;
};

export default SimuFunnelLayout;
