import "@gouvfr/dsfr/dist/dsfr.main.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";

import { useRouter } from "next/router";
import type { PropsWithChildren } from "react";
import React from "react";

import { AsideLink } from "./RepartitionEquilibreeStartLayout";
import {
  App,
  Container,
  ContentWithAside,
  ContentWithAsideMain,
  ContentWithAsideSideMenu,
  SideMenu,
  SideMenuCollapse,
  SideMenuList,
  SideMenuTitle,
} from "@design-system";

// Layout for authenticated users (i.e. the wizard).

// eslint-disable-next-line @typescript-eslint/ban-types -- no props
export const RepartitionEquilibreeLayout = ({ children }: PropsWithChildren<{}>) => {
  const router = useRouter();
  const currentRoute = router.pathname;
  return (
    <App>
      <Container>
        <ContentWithAside>
          <ContentWithAsideSideMenu>
            <SideMenu buttonLabel={"Dans cette rubrique"}>
              <SideMenuTitle>Répartition équilibrée</SideMenuTitle>
              <SideMenuList>
                <AsideLink path="commencer">Commencer ou accéder à une déclaration</AsideLink>
                <AsideLink path="declarant">Informations déclarant</AsideLink>
                <AsideLink path="entreprise">Informations entreprise</AsideLink>
                <AsideLink path="#">Période de référence</AsideLink>
                <SideMenuCollapse
                  isExpandedDefault
                  title="Écarts de représentation"
                  isCurrent={
                    currentRoute === "/ecart-rep/ecarts-cadres" || currentRoute === "/ecart-rep/ecarts-menbres"
                  }
                >
                  <AsideLink path="ecarts-cadres">Cadres dirigeants</AsideLink>
                  <AsideLink path="ecarts-menbres">Membres des instances dirigeantes</AsideLink>
                </SideMenuCollapse>
                <AsideLink path="#">Publication</AsideLink>
                <AsideLink path="#">Récapitulatif</AsideLink>
                <AsideLink path="#">Validation</AsideLink>
                <AsideLink path="#">Transmission</AsideLink>
              </SideMenuList>
            </SideMenu>
          </ContentWithAsideSideMenu>
          <ContentWithAsideMain>{children}</ContentWithAsideMain>
        </ContentWithAside>
      </Container>
    </App>
  );
};
