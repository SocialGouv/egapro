import "@fontsource/gabriela";
import "@fontsource/cabin";

import { ChakraProvider } from "@chakra-ui/react";
import { init } from "@socialgouv/matomo-next";

import type { AppProps } from "next/app";
import React, { useEffect } from "react";

import { SinglePageLayout } from "../components/ds/SinglePageLayout";
import { theme } from "../theme";

export default function EgaproApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    init({
      url: process.env.NEXT_PUBLIC_MATOMO_URL ?? "",
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? "",
    });
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <SinglePageLayout>
        <Component {...pageProps} />
      </SinglePageLayout>
    </ChakraProvider>
  );
}
