import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { ContentWithAside, SideMenu } from "@/design-system";

export default {
  title: "Layout/ContentWithAside",
  component: ContentWithAside,
} as ComponentMeta<typeof ContentWithAside>;

const Template: ComponentStory<typeof ContentWithAside> = () => (
  <ContentWithAside>
    <ContentWithAside.SideMenu>
      <SideMenu buttonLabel="Dans cette rubrique">
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
    </ContentWithAside.SideMenu>
    <ContentWithAside.Main>
      <div style={{ height: "200vw", background: "green" }} />
    </ContentWithAside.Main>
  </ContentWithAside>
);

export const Default = Template.bind({});
