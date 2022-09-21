import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { App, Container, ContentWithAside, SideMenu, SideMenuList, SideMenuLink, Link } from "../src/design-system";

export default {
  title: "Layout/App",
  component: App,
} as ComponentMeta<typeof App>;

const Template: ComponentStory<typeof App> = () => (
  <App>
    <Container className="fr-py-12v">
      <div className="fr-pb-12v">
        <Link href="/" iconLeft="fr-icon-arrow-left-line">
          Accueil
        </Link>
      </div>
      <ContentWithAside
        aside={
          <SideMenu
            buttonLabel={"Dans cette rubrique"}
            title={"Déclaration des écarts de représentation F/H dans les postes de direction"}
          >
            <SideMenuList>
              <SideMenuLink href="#" isCurrent>
                Êtes-vous assujetti&nbsp;?
              </SideMenuLink>
              <SideMenuLink href="#" target="_self">
                Validation de l’email
              </SideMenuLink>
            </SideMenuList>
          </SideMenu>
        }
        content={<div>Content here</div>}
      />
    </Container>
  </App>
);

export const Default = Template.bind({});
