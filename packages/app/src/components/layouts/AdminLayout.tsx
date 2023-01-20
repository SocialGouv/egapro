import { ClientOnly } from "@components/ClientOnly";
import { DsfrScript } from "@components/DsfrScript";
import { StaffOnly } from "@components/StaffOnly";
import Head from "next/head";
import type { PropsWithChildren } from "react";

import { App } from "./App";

const DEFAULT_TITLE = "Egapro Backoffice";

/**
 * Layout for admin pages like bo.
 */
export const AdminLayout = ({ children, title }: PropsWithChildren & { title?: string | undefined }) => {
  return (
    <App>
      <Head>
        <title>{title ? title + " - " + DEFAULT_TITLE : DEFAULT_TITLE}</title>
      </Head>
      <DsfrScript />

      <ClientOnly>
        <StaffOnly>{children}</StaffOnly>
      </ClientOnly>
    </App>
  );
};
