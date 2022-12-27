import "@gouvfr/dsfr/dist/dsfr.main.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.min.css";

import { ClientOnly } from "@components/ClientOnly";
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

      <ClientOnly>
        <StaffOnly>{children}</StaffOnly>
      </ClientOnly>
    </App>
  );
};
