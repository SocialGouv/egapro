import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { SideMenu } from "@/design-system";

export default {
  title: "Base/SideMenu",
  component: SideMenu,
} as ComponentMeta<typeof SideMenu>;

const Template: ComponentStory<typeof SideMenu> = args => (
  <SideMenu {...args}>
    <SideMenu.Title>Déclaration des écarts de représentation F/H dans les postes de direction</SideMenu.Title>
    <SideMenu.List>
      <SideMenu.Link href="#" isCurrent>
        Êtes-vous assujetti&nbsp;?
      </SideMenu.Link>
      <SideMenu.Link href="#" target="_self">
        Validation de l’email
      </SideMenu.Link>
      <SideMenu.Collapse title="Écarts de représentation">
        <SideMenu.Link href="#">Cadres dirigeants</SideMenu.Link>
        <SideMenu.Link href="#" target="_self">
          Membres des instances dirigeantes
        </SideMenu.Link>
      </SideMenu.Collapse>
      <SideMenu.Collapse title="Écarts de représentation" isCurrent isExpandedDefault>
        <SideMenu.Link href="#">Cadres dirigeants</SideMenu.Link>
        <SideMenu.Link href="#" target="_self" isCurrent>
          Membres des instances dirigeantes
        </SideMenu.Link>
      </SideMenu.Collapse>
      <SideMenu.Link href="#">Lorem ipsum</SideMenu.Link>
    </SideMenu.List>
  </SideMenu>
);

export const Default = Template.bind({});
Default.args = {
  buttonLabel: "Dans cette rubrique",
};
