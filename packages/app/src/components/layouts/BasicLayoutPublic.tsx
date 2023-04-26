import { PublicFooter } from "@components/Footers";
import Head from "next/head";
import { type PropsWithChildren } from "react";

import { App } from "./App";

const DEFAULT_TITLE = "Egapro";

/**
 * Layout for unauthenticated users (standalone pages, etc.).
 */
export const BasicLayoutPublic = ({ children, title }: PropsWithChildren & { title?: string | undefined }) => {
  return (
    <App footer={<PublicFooter />}>
      <Head>
        <title>{title ? title + " - " + DEFAULT_TITLE : DEFAULT_TITLE}</title>
      </Head>
      {children}
    </App>
  );
};
