import "@fontsource/cabin";
import "@fontsource/gabriela";

import { init } from "@socialgouv/matomo-next";
import type { AppProps } from "next/app";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { SWRConfig } from "swr";

import { fetcher } from "@services/apiClient";

export type NextPageWithLayout = AppProps["Component"] & {
  getLayout?: (props: PropsWithChildren) => JSX.Element;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  useEffect(() => {
    init({
      url: process.env.NEXT_PUBLIC_MATOMO_URL ?? "",
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? "",
    });
  }, []);

  // Use the layout defined at the page level, if available
  const Layout = Component.getLayout ?? (({ children }) => <>{children}</>);

  return (
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
  );
};

export default MyApp;