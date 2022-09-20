import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { SideMenu, SideMenuItem, SideMenuLink } from "../src/design-system";

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
    <>
      <SideMenuItem isCurrent>
        <SideMenuLink href="#" isCurrent>
          Êtes-vous assujetti&nbsp;?
        </SideMenuLink>
      </SideMenuItem>
      <SideMenuItem>
        <SideMenuLink href="#" target="_self">
          Validation de l’email
        </SideMenuLink>
      </SideMenuItem>
    </>
  ),
};
