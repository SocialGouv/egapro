import { DsfrScript } from "@components/DsfrScript";
import Head from "next/head";
import type { PropsWithChildren } from "react";

import { App } from "./App";

const DEFAULT_TITLE = "Egapro";

/**
 * Layout for unauthenticated users (standalone pages, etc.).
 */
export const BasicLayout = ({ children, title }: PropsWithChildren & { title?: string | undefined }) => {
  return (
    <App>
      <Head>
        <title>{title ? title + " - " + DEFAULT_TITLE : DEFAULT_TITLE}</title>
      </Head>
      <DsfrScript />
      {children}
    </App>
  );
};
