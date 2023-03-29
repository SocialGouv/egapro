import { DsfrScript } from "@components/DsfrScript";
import { PublicFooter } from "@components/Footers";
import { Container, Grid, GridCol, SideMenuLink } from "@design-system";
import Head from "next/head";
import { useRouter } from "next/router";
import type { PropsWithChildren } from "react";

import { App } from "./App";

export type AsideLinkProps = PropsWithChildren<{
  path: string;
}>;

export const AsideLink = ({ path, children }: AsideLinkProps) => {
  const router = useRouter();
  const currentRoute = router.pathname;
  return (
    <SideMenuLink
      href={`/representation-equilibree/${path}/`}
      isCurrent={currentRoute === `/representation-equilibree/${path}`}
    >
      {children}
    </SideMenuLink>
  );
};

const DEFAULT_TITLE = "Recherche - Représentation équilibrée Egapro";

export const ConsultationRepeqLayout = ({ children, title }: PropsWithChildren & { title?: string | undefined }) => {
  return (
    <App footer={<PublicFooter />}>
      <Head>
        <title>{title ? title + " - " + DEFAULT_TITLE : DEFAULT_TITLE}</title>
      </Head>

      <DsfrScript />

      <Container py="6w">
        <Grid justifyCenter>
          <GridCol md={10} lg={8}>
            {children}
          </GridCol>
        </Grid>
      </Container>
    </App>
  );
};
