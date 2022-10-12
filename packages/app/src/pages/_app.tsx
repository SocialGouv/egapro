import "@fontsource/gabriela";
import "@fontsource/cabin";

import { init } from "@socialgouv/matomo-next";
import type { AppProps } from "next/app";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";

import React from "react";

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
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
};

export default MyApp;
