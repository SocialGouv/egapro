import { DsfrScript } from "@components/DsfrScript";
import { Container, Grid, GridCol, SideMenuLink } from "@design-system";
import Head from "next/head";
import NextLink from "next/link";
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
    <NextLink href={`/representation-equilibree/${path}/`} passHref>
      <SideMenuLink isCurrent={currentRoute === `/representation-equilibree/${path}`}>{children}</SideMenuLink>
    </NextLink>
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
