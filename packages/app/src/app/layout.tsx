import "./StartDsfr";

import { ConsentBanner } from "@codegouvfr/react-dsfr/ConsentBanner";
import Display from "@codegouvfr/react-dsfr/Display";
import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getColorSchemeHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getColorSchemeHtmlAttributes";
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks";
import { config } from "@common/config";
import { FeatureStatusProvider } from "@components/rdsfr/FeatureStatusProvider";
import { Matomo } from "@components/utils/Matomo";
import type Link from "next/link";
import { type PropsWithChildren, Suspense } from "react";

import { defaultColorScheme } from "./defaultColorScheme";
import { SessionProvider } from "./SessionProvider";

export const metadata = {
  metadataBase: new URL(config.host),
  description:
    "Egapro permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression.",
  title: {
    template: "Egapro - %s",
    default: "Egapro",
  },
  openGraph: {
    title: {
      template: "Egapro - %s",
      default: "Egapro",
    },
  },
};

declare module "@codegouvfr/react-dsfr/next-appdir" {
  interface RegisterLink {
    Link: typeof Link;
  }
}

declare module "@codegouvfr/react-dsfr/gdpr" {
  interface RegisterGdprServices {
    egapro: true;
    matomo: never;
  }
}

const RootLayout = ({ children }: PropsWithChildren) => (
  <html lang="fr" {...getColorSchemeHtmlAttributes({ defaultColorScheme })}>
    <head>
      <DsfrHead
        defaultColorScheme={defaultColorScheme}
        preloadFonts={[
          "Marianne-Light",
          "Marianne-Light_Italic",
          "Marianne-Regular",
          "Marianne-Regular_Italic",
          "Marianne-Medium",
          "Marianne-Medium_Italic",
          "Marianne-Bold",
          "Marianne-Bold_Italic",
          //"Spectral-Regular",
          //"Spectral-ExtraBold"
        ]}
      />

      <Suspense>
        <Matomo env={config.env} />
      </Suspense>
    </head>
    <body>
      <FeatureStatusProvider>
        <SessionProvider basePath="/apiv2/auth" refetchOnWindowFocus>
          <DsfrProvider defaultColorScheme={defaultColorScheme}>
            <SkipLinks
              links={[
                {
                  anchor: "#content",
                  label: "Contenu",
                },
                {
                  anchor: "#footer",
                  label: "Pied de page",
                },
              ]}
            />
            <ConsentBanner
              gdprLinkProps={{
                href: "/politique-de-confidentialite#cookies",
              }}
              siteName="Egapro"
              services={[
                {
                  name: "egapro",
                  title: "Egapro",
                  description: "Cookies obligatoires permettant de sauvegarder l'état d'authentification.",
                  mandatory: true,
                },
                {
                  name: "matomo",
                  title: "Matomo",
                  description: "Outil d’analyse comportementale des utilisateurs.",
                },
              ]}
            />
            {children}
            <Display />
          </DsfrProvider>
        </SessionProvider>
      </FeatureStatusProvider>
    </body>
  </html>
);

export default RootLayout;
