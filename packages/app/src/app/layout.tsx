import "./StartDsfr";

import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getColorSchemeHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getColorSchemeHtmlAttributes";
import { config } from "@common/config";
import { Matomo } from "@components/utils/Matomo";
import Link from "next/link";
import { type PropsWithChildren } from "react";

import { ConsentBanner } from "../design-system/base/custom/ConsentBanner";
import { defaultColorScheme } from "./defaultColorScheme";

const RootLayout = ({ children }: PropsWithChildren) => (
  <html lang="fr" {...getColorSchemeHtmlAttributes({ defaultColorScheme })}>
    <head>
      <DsfrHead
        defaultColorScheme={defaultColorScheme}
        preloadFonts={[
          //"Marianne-Light",
          //"Marianne-Light_Italic",
          "Marianne-Regular",
          //"Marianne-Regular_Italic",
          "Marianne-Medium",
          //"Marianne-Medium_Italic",
          "Marianne-Bold",
          //"Marianne-Bold_Italic",
          //"Spectral-Regular",
          //"Spectral-ExtraBold"
        ]}
      />

      <Matomo env={config.env} />
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
      <DsfrProvider defaultColorScheme={defaultColorScheme}>
        <ConsentBanner
          gdprPageLink="/politique-de-confidentialite#cookies"
          gdprPageLinkAs={Link}
          siteName="Egapro"
          services={[
            {
              name: "matomo",
              title: "Matomo",
              description: "Outil d’analyse comportementale des utilisateurs.",
            },
          ]}
        />
        {children}
      </DsfrProvider>
    </body>
  </html>
);

export default RootLayout;
