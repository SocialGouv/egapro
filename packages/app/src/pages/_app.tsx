import "@fontsource/gabriela";
import "@fontsource/cabin";

import { ChakraProvider } from "@chakra-ui/react";
import { init } from "@socialgouv/matomo-next";

import type { AppProps } from "next/app";
import type { ReactElement, ReactNode } from "react";
import React from "react";

import { theme } from "../theme";
import type { SimpleObject } from "@common/utils/types";
import { ConsulterIndexLayout } from "@components/ds/ConsulterIndexLayout";

const layouts: SimpleObject<(page: ReactElement) => ReactNode> = {
  "consulter-index": page => <ConsulterIndexLayout>{page}</ConsulterIndexLayout>,
  "repartition-equilibree": page => <div style={{ backgroundColor: "red", color: "yellow" }}>{page}</div>,
  // TODO remove -- only for demo purpose
  "repartition-equilibree/mapage": page => <>{page}</>,
};

export default function MyApp({ Component, pageProps, router }: AppProps) {
  React.useEffect(() => {
    init({
      url: process.env.NEXT_PUBLIC_MATOMO_URL ?? "",
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? "",
    });
  }, []);

  const base = router.pathname.split("/")[1];
  const getLayout = layouts[base] ?? (page => page);

  const componentWithLayout = getLayout(<Component {...pageProps} />);

  return <ChakraProvider theme={theme}>{componentWithLayout}</ChakraProvider>;
}
