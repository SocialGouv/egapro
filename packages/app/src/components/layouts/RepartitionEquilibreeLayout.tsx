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

// Layout for authenticated users (i.e. the wizard).

// eslint-disable-next-line @typescript-eslint/ban-types -- no props
export const RepartitionEquilibreeLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <App>
      <Container>
        <ContentWithAside>
          <ContentWithAsideSideMenu>
            <SideMenu buttonLabel={"Dans cette rubrique"}>
              <SideMenuTitle>Répartition équilibrée</SideMenuTitle>
              <SideMenuList>
                <SideMenuLink href="#">Commencer ou accéder à une déclaration</SideMenuLink>
                <SideMenuLink href="#">Informations déclarant</SideMenuLink>
                <SideMenuLink href="#">Informations entreprise</SideMenuLink>
                <SideMenuLink href="#">Période de référence</SideMenuLink>
                <SideMenuLink href="#">Écarts de représentation</SideMenuLink>
                <SideMenuLink href="#">Publication</SideMenuLink>
                <SideMenuLink href="#">Récapitulatif</SideMenuLink>
                <SideMenuLink href="#">Validation</SideMenuLink>
                <SideMenuLink href="#">Transmission</SideMenuLink>
              </SideMenuList>
            </SideMenu>
          </ContentWithAsideSideMenu>
          <ContentWithAsideMain>{children}</ContentWithAsideMain>
        </ContentWithAside>
      </Container>
    </App>
  );
};
