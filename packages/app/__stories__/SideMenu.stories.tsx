import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { SideMenu, SideMenuCollapse, SideMenuLink, SideMenuList } from "../src/design-system";

export default {
  title: "Base/SideMenu",
  component: SideMenu,
} as ComponentMeta<typeof SideMenu>;

const Template: ComponentStory<typeof SideMenu> = args => <SideMenu {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: "Déclaration des écarts de représentation F/H dans les postes de direction",
  buttonLabel: "Dans cette rubrique",
  children: (
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
    </SideMenuList>
  ),
};
