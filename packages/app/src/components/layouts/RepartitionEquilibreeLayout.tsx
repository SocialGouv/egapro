import "@gouvfr/dsfr/dist/dsfr.main.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";

import type { PropsWithChildren } from "react";
import React from "react";

import { App, Container, ContentWithAside, SideMenu } from "@design-system";

// eslint-disable-next-line @typescript-eslint/ban-types -- no props
export const RepartitionEquilibreeLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <App>
      <Container>
        <ContentWithAside
          aside={
            <SideMenu buttonLabel={"Dans cette rubrique"} title={"Répartition équilibrée"}>
              {/* <SideMenuList>
                <SideMenuLink href="#" isCurrent>
                  Êtes-vous assujetti&nbsp;?
                </SideMenuLink>
                <SideMenuLink href="#" target="_self">
                  Validation de l’email
                </SideMenuLink>
              </SideMenuList> */}
            </SideMenu>
          }
          content={children}
        />
      </Container>
    </App>
  );
};
