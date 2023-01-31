import { DsfrScript } from "@components/DsfrScript";
import { EntrepriseFooter } from "@components/Footers";
import Head from "next/head";
import type { PropsWithChildren } from "react";

import { App } from "./App";

const DEFAULT_TITLE = "Egapro";

/**
 * Layout for unauthenticated users (standalone pages, etc.).
 */
export const BasicLayoutEntreprise = ({ children, title }: PropsWithChildren & { title?: string | undefined }) => {
  return (
    <App footer={<EntrepriseFooter />}>
      <Head>
        <title>{title ? title + " - " + DEFAULT_TITLE : DEFAULT_TITLE}</title>
      </Head>
      <DsfrScript />
      {children}
    </App>
  );
};
