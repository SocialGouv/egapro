import "@gouvfr/dsfr/dist/dsfr.main.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";

import NextLink from "next/link";
import { useRouter } from "next/router";
import type { PropsWithChildren } from "react";
import React from "react";

import {
  App,
  Container,
  ContentWithAside,
  ContentWithAsideMain,
  ContentWithAsideSideMenu,
  SideMenu,
  SideMenuLink,
  SideMenuList,
  SideMenuTitle,
} from "@design-system";

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

// eslint-disable-next-line @typescript-eslint/ban-types -- no props
export const RepartitionEquilibreeStartLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <App>
      <Container>
        <ContentWithAside>
          <ContentWithAsideSideMenu>
            <SideMenu buttonLabel={"Dans cette rubrique"}>
              <SideMenuTitle>Répartition équilibrée</SideMenuTitle>
              <SideMenuList>
                <AsideLink path="assujetti">Êtes-vous assujetti&nbsp;?</AsideLink>
                <AsideLink path="email">Validation de l’email</AsideLink>
              </SideMenuList>
            </SideMenu>
          </ContentWithAsideSideMenu>
          <ContentWithAsideMain>{children}</ContentWithAsideMain>
        </ContentWithAside>
      </Container>
    </App>
  );
};
