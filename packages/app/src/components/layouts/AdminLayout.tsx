import { ClientOnly } from "@components/ClientOnly";
import { StaffOnly } from "@components/StaffOnly";
import Head from "next/head";
import type { PropsWithChildren, ReactNode } from "react";

import { App } from "./App";

const DEFAULT_TITLE = "Egapro Backoffice";

export interface AdminLayoutProps {
  placeholder?: ReactNode;
  title?: string;
}

/**
 * Layout for admin pages like bo.
 */
export const AdminLayout = ({ children, title, placeholder }: PropsWithChildren<AdminLayoutProps>) => {
  return (
    <App>
      <Head>
        <title>{title ? title + " - " + DEFAULT_TITLE : DEFAULT_TITLE}</title>
      </Head>

      <ClientOnly>
        <StaffOnly placeholder={placeholder}>{children}</StaffOnly>
      </ClientOnly>
    </App>
  );
};
