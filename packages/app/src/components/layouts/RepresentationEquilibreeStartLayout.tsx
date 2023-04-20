import { Container, Grid, GridCol } from "@design-system";
import { SideMenuLink } from "@design-system/client";
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

const DEFAULT_TITLE = "Représentation équilibrée Egapro";

export const RepresentationEquilibreeStartLayout = ({
  children,
  title,
}: PropsWithChildren & { title?: string | undefined }) => {
  return (
    <App>
      <Head>
        <title>{title ? title + " - " + DEFAULT_TITLE : DEFAULT_TITLE}</title>
      </Head>

      <Container py="6w">
        <Grid align="center">
          <GridCol md={10} lg={8}>
            {children}
          </GridCol>
        </Grid>
      </Container>
    </App>
  );
};
