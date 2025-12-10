export const dynamic = "force-dynamic";
import "./global.css";
import "@design-system/utils/client/skeleton/Skeleton.scss";
import "react-tooltip/dist/react-tooltip.css";

import { DsfrHeadBase } from "@codegouvfr/react-dsfr/next-app-router/DsfrHead";
import { createGetHtmlAttributes } from "@codegouvfr/react-dsfr/next-app-router/getHtmlAttributes";
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks";
import { config } from "@common/config";
import { ConfigProvider } from "@components/utils/ConfigProvider";
import { FeatureStatusProvider } from "@components/utils/FeatureStatusProvider";
import { Matomo } from "@components/utils/Matomo";
import { SentryErrorBoundary } from "@components/utils/SentryErrorBoundary";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { SkeletonTheme } from "@design-system/utils/client/skeleton";
import Link from "next/link";
import { type PropsWithChildren, Suspense } from "react";

import { ConsentBannerAndConsentManagement } from "./consentManagement";
import { defaultColorScheme } from "./defaultColorScheme";
import { DsfrProviderWrapper } from "./DsfrProviderWrapper";
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
  robots: "noindex, nofollow",
};

const RootLayout = ({ children }: PropsWithChildren) => {
  const nonce = undefined; // TODO: fix nonce in Next.js 16
  const mcpconfig = {
    isProConnectTest: false,
    isEmailLogin: config.api.security.auth.isEmailLogin,
  };
  const { getHtmlAttributes } = createGetHtmlAttributes({ defaultColorScheme });
  return (
    <html {...getHtmlAttributes({ lang: "fr" })} className={style.app}>
      <head>
        <StartDsfr />
        <DsfrHeadBase
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
        <FeatureStatusProvider>
          <SessionProvider basePath="/api/auth" refetchOnWindowFocus>
            <DsfrProviderWrapper lang="fr" defaultColorScheme={defaultColorScheme}>
              <SkeletonTheme
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
                <ConfigProvider config={mcpconfig}>
                  <SentryErrorBoundary>{children}</SentryErrorBoundary>
                </ConfigProvider>
              </SkeletonTheme>
            </DsfrProviderWrapper>
          </SessionProvider>
        </FeatureStatusProvider>
      </body>
    </html>
  );
};

export default RootLayout;
