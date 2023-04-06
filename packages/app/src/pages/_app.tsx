import "@fontsource/cabin";
import "@fontsource/gabriela";

import { createNextDsfrIntegrationApi } from "@codegouvfr/react-dsfr/next-pagesdir";
import { config } from "@common/config";
import { Matomo } from "@components/utils/Matomo";
import { fetcher } from "@services/apiClient";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { SWRConfig } from "swr";
import { SWRDevTools } from "swr-devtools";

import { ConsentBanner } from "../design-system/base/custom/ConsentBanner";

// Only in TypeScript projects
declare module "@codegouvfr/react-dsfr/next-pagesdir" {
  interface RegisterLink {
    Link: typeof Link;
  }
}

declare module "../design-system/base/custom/ConsentBanner" {
  interface GdprServiceNames {
    matomo: never;
  }
}

const { withDsfr, dsfrDocumentApi } = createNextDsfrIntegrationApi({
  defaultColorScheme: "system",
  Link,
});

export { dsfrDocumentApi };

///

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (props: PropsWithChildren) => JSX.Element;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  // Use the layout defined at the page level, if available
  const Layout = Component.getLayout ?? (({ children }) => <>{children}</>);

  return (
    <>
      <Matomo env={config.env} />
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
      <SWRDevTools>
        <SWRConfig
          value={{
            fetcher,
            revalidateOnFocus: false,
            onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
              // Never retry on 401 Unauthorized.
              if (error.statusCode === 401) return;

              // Never retry on 404.
              if (error.statusCode === 404) return;

              // Never retry on 403 Forbidden.
              if (error.statusCode === 403) return;

              // Never retry on 422 Unprocessable Entity.
              if (error.statusCode === 422) return;

              // Only retry up to 3 times.
              if (retryCount >= 3) return;

              // Retry after 5 seconds.
              setTimeout(() => revalidate({ retryCount }), 5000);
            },
          }}
        >
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </SWRConfig>
      </SWRDevTools>
    </>
  );
};

export default withDsfr(MyApp);
