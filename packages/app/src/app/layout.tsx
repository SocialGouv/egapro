import "./global.css";
import "react-tooltip/dist/react-tooltip.css";
import "./dsfr.css";

import { fr } from "@codegouvfr/react-dsfr";
import { DsfrHeadBase as DsfrHead } from "@codegouvfr/react-dsfr/next-app-router/DsfrHead";
import { DsfrProviderBase as DsfrProvider } from "@codegouvfr/react-dsfr/next-app-router/DsfrProvider";
import { createGetHtmlAttributes } from "@codegouvfr/react-dsfr/next-app-router/getHtmlAttributes";
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks";
import { config } from "@common/config";
import { Matomo } from "@components/utils/Matomo";
import { headers } from "next/headers";
import Link from "next/link";
import { type PropsWithChildren, Suspense } from "react";

import { ConsentBannerAndConsentManagement } from "./consentManagement";
import { AppFooter } from "./Footer";
import { AppHeader } from "./Header";
import style from "./root.module.scss";

const { getHtmlAttributes } = createGetHtmlAttributes({
  defaultColorScheme: "system",
});

const description =
  "Egapro permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression.";

export const metadata = {
  // metadataBase: new URL(config.host),
  description,
  title: {
    template: "Egapro - %s",
    default: "Egapro",
  },
  openGraph: {
    title: {
      template: "Egapro - %s",
      default: "Egapro",
    },
    description,
  },
};

const RootLayout = ({ children }: PropsWithChildren) => {
  const nonce = headers().get("x-nonce") ?? void 0;
  // const mcpconfig = {
  //   isProConnectTest: config.api.security.moncomptepro.appTest,
  //   isEmailLogin: config.api.security.auth.isEmailLogin,
  // };
  return (
    <html {...getHtmlAttributes({ lang: "fr" })} className={style.app}>
      <head>
        <DsfrHead
          Link={Link}
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
          nonce={nonce}
        />
        {/* for styled-jsx */}
        <meta property="csp-nonce" content={nonce} />

        <Suspense>
          <Matomo env={config.env} nonce={nonce} matomo={config.matomo} />
        </Suspense>
      </head>
      <body>
        <DsfrProvider Link={Link} lang="fr" defaultColorScheme="system">
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
          <ConsentBannerAndConsentManagement />
          <AppHeader />
          <div className={fr.cx("fr-container")}>
            <div className={fr.cx("fr-mt-2w")} id="content">
              {children}
            </div>
          </div>
          <AppFooter />
        </DsfrProvider>
      </body>
    </html>
  );
};

export default RootLayout;
