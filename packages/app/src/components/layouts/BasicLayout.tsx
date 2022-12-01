import "@gouvfr/dsfr/dist/dsfr.main.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.min.css";

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
      {children}
    </App>
  );
};
