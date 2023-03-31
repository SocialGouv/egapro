import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getColorSchemeHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getColorSchemeHtmlAttributes";
import { type PropsWithChildren } from "react";

import { defaultColorScheme } from "./defaultColorScheme";

const RootLayout = ({ children }: PropsWithChildren) => (
  <html {...getColorSchemeHtmlAttributes({ defaultColorScheme })}>
    <body>
      <DsfrProvider defaultColorScheme={defaultColorScheme}>{children}</DsfrProvider>
    </body>
  </html>
);

export default RootLayout;
