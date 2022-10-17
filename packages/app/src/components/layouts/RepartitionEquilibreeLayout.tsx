import "@gouvfr/dsfr/dist/dsfr.main.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";

import { useRouter } from "next/router";
import type { PropsWithChildren } from "react";
import React from "react";
import styles from "./RepartitionEquilibreeLayout.module.css";

import { AsideLink } from "./RepartitionEquilibreeStartLayout";
import {
  App,
  Box,
  Card,
  CardBody,
  CardBodyContent,
  CardBodyContentDescription,
  CardBodyContentTitle,
  CardHeader,
  CardHeaderImg,
  Container,
  ContentWithAside,
  ContentWithAsideMain,
  ContentWithAsideSideMenu,
  Grid,
  GridCol,
  SideMenu,
  SideMenuCollapse,
  SideMenuList,
  SideMenuTitle,
} from "@design-system";

// Layout for authenticated users (i.e. the wizard).
export const RepartitionEquilibreeLayout = ({
  children,
  haveBottomSection,
}: PropsWithChildren<{ haveBottomSection?: boolean }>) => {
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
                    currentRoute === "/ecart-rep/ecarts-cadres" || currentRoute === "/ecart-rep/ecarts-membres"
                  }
                >
                  <AsideLink path="ecarts-cadres">Cadres dirigeants</AsideLink>
                  <AsideLink path="ecarts-membres">Membres des instances dirigeantes</AsideLink>
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
      {haveBottomSection && (
        <Box py="9w" className={styles.gradient}>
          <Container>
            <Grid justifyCenter>
              <GridCol lg={8}>
                <Card size="sm" isEnlargeLink noBorder isHorizontal>
                  <CardBody>
                    <CardBodyContent>
                      <CardBodyContentTitle>
                        <a href="#">Avez-vous déclaré l’index égalité professionnelle F/H&nbsp;?</a>
                      </CardBodyContentTitle>
                      <CardBodyContentDescription>
                        Toutes les entreprises d’au moins 50 salariés doivent calculer et publier leur Index de
                        l’égalité professionnelle entre les femmes et les hommes, chaque année au plus tard le 1er mars.
                      </CardBodyContentDescription>
                    </CardBodyContent>
                  </CardBody>
                  <CardHeader>
                    <CardHeaderImg>
                      {/* TODO: Add real image */}
                      <img
                        className="fr-responsive-img"
                        src="https://www.systeme-de-design.gouv.fr/img/placeholder.16x9.png"
                        alt=""
                      />
                    </CardHeaderImg>
                  </CardHeader>
                </Card>
              </GridCol>
            </Grid>
          </Container>
        </Box>
      )}
    </App>
  );
};
