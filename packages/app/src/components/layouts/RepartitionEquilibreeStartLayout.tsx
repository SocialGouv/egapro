import "@gouvfr/dsfr/dist/dsfr.main.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";

import NextLink from "next/link";
import { useRouter } from "next/router";
import type { PropsWithChildren } from "react";
import React from "react";

import { App, Container, Grid, GridCol, SideMenuLink } from "@design-system";

// Layout for unauthenticated users.

type AsideLinkProps = PropsWithChildren<{
  path: string;
}>;

export const AsideLink = ({ path, children }: AsideLinkProps) => {
  const router = useRouter();
  const currentRoute = router.pathname;
  return (
    <NextLink href={`/ecart-rep/${path}/`} passHref>
      <SideMenuLink isCurrent={currentRoute === `/ecart-rep/${path}`}>{children}</SideMenuLink>
    </NextLink>
  );
};

export const RepartitionEquilibreeStartLayout = ({ children }: PropsWithChildren) => {
  return (
    <App>
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
