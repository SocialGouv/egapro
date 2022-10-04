import type { ComponentStory, ComponentMeta } from "@storybook/react";

import {
  ContentWithAside,
  ContentWithAsideMain,
  ContentWithAsideSideMenu,
  SideMenu,
  SideMenuCollapse,
  SideMenuLink,
  SideMenuList,
  SideMenuTitle,
} from "@/design-system";

export default {
  title: "Layout/ContentWithAside",
  component: ContentWithAside,
} as ComponentMeta<typeof ContentWithAside>;

const Template: ComponentStory<typeof ContentWithAside> = () => (
  <ContentWithAside>
    <ContentWithAsideSideMenu>
      <SideMenu buttonLabel="Dans cette rubrique">
        <SideMenuTitle>Déclaration des écarts de représentation F/H dans les postes de direction</SideMenuTitle>
        <SideMenuList>
          <SideMenuLink href="#" isCurrent>
            Êtes-vous assujetti&nbsp;?
          </SideMenuLink>
          <SideMenuLink href="#" target="_self">
            Validation de l’email
          </SideMenuLink>
          <SideMenuCollapse title="Écarts de représentation">
            <SideMenuLink href="#">Cadres dirigeants</SideMenuLink>
            <SideMenuLink href="#" target="_self">
              Membres des instances dirigeantes
            </SideMenuLink>
          </SideMenuCollapse>
          <SideMenuCollapse title="Écarts de représentation" isCurrent isExpandedDefault>
            <SideMenuLink href="#">Cadres dirigeants</SideMenuLink>
            <SideMenuLink href="#" target="_self" isCurrent>
              Membres des instances dirigeantes
            </SideMenuLink>
          </SideMenuCollapse>
          <SideMenuLink href="#">Lorem ipsum</SideMenuLink>
        </SideMenuList>
      </SideMenu>
    </ContentWithAsideSideMenu>
    <ContentWithAsideMain>
      <div style={{ height: "200vw", background: "green" }} />
    </ContentWithAsideMain>
  </ContentWithAside>
);

export const Default = Template.bind({});
