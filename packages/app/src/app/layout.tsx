import "react-loading-skeleton/dist/skeleton.css";

import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks";
import { config } from "@common/config";
import { FeatureStatusProvider } from "@components/utils/FeatureStatusProvider";
import { IsomorphicSkeletonTheme } from "@components/utils/skeleton/IsomorphicSkeletonTheme";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { headers } from "next/headers";
import Link from "next/link";
import { type PropsWithChildren } from "react";

import { ConsentBannerAndConsentManagement } from "./consentManagement";
import { defaultColorScheme } from "./defaultColorScheme";
import { ImpersonateNotice } from "./ImpersonateNotice";
import style from "./root.module.scss";
import { SessionProvider } from "./SessionProvider";
import { StartDsfr } from "./StartDsfr";

const description =
  "Egapro permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression.";

export const metadata = {
  metadataBase: new URL(config.host),
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

const RootLayout = ({ children }: PropsWithChildren) => (
  <html lang="fr" {...getHtmlAttributes({ defaultColorScheme })} className={style.app}>
    <head>
      <StartDsfr />
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
        nonce={headers().get("x-nonce") ?? void 0}
      />

      {/* <Suspense>
        <Matomo env={config.env} />
      </Suspense> */}
    </head>
    <body>
      <FeatureStatusProvider>
        <SessionProvider basePath="/api/auth" refetchOnWindowFocus>
          <DsfrProvider>
            <IsomorphicSkeletonTheme
              baseColor="var(--background-contrast-grey)"
              highlightColor="var(--background-contrast-grey-active)"
              borderRadius="0.25rem"
              duration={2}
            >
              <ClientAnimate>
                <ImpersonateNotice />
              </ClientAnimate>
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
              {children}
            </IsomorphicSkeletonTheme>
          </DsfrProvider>
        </SessionProvider>
      </FeatureStatusProvider>
    </body>
  </html>
);

export default RootLayout;
