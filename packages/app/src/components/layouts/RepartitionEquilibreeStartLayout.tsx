import "@gouvfr/dsfr/dist/dsfr.main.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";

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
                <SideMenuLink href="#">Êtes-vous assujetti&nbsp;?</SideMenuLink>
                <SideMenuLink href="#" target="_self" isCurrent>
                  Validation de l’email
                </SideMenuLink>
              </SideMenuList>
            </SideMenu>
          </ContentWithAsideSideMenu>
          <ContentWithAsideMain>{children}</ContentWithAsideMain>
        </ContentWithAside>
      </Container>
    </App>
  );
};
