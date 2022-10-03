import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { App, Container, ContentWithAside, SideMenu } from "@/design-system";

export default {
  title: "Layout/App",
  component: App,
} as ComponentMeta<typeof App>;

const Template: ComponentStory<typeof App> = () => (
  <App>
    <Container>
      <ContentWithAside
        aside={
          <SideMenu buttonLabel={"Dans cette rubrique"}>
            <SideMenu.Title>Déclaration des écarts de représentation F/H dans les postes de direction</SideMenu.Title>
            <SideMenu.List>
              <SideMenu.Link href="#" isCurrent>
                Êtes-vous assujetti&nbsp;?
              </SideMenu.Link>
              <SideMenu.Link href="#" target="_self">
                Validation de l’email
              </SideMenu.Link>
            </SideMenu.List>
          </SideMenu>
        }
        content={
          <>
            <h1>Êtes-vous assujetti&nbsp;?</h1>
            <p>
              <strong>
                Les entreprises qui emploient au moins 1 000 salariés pour le troisième exercice consécutif doivent
                publier et déclarer chaque année
              </strong>{" "}
              au plus tard le 1er mars leurs écarts éventuels de représentation entre les femmes et les hommes parmi,
              d’une part, leurs cadres dirigeants, et d’autre part, les membres de leurs instances dirigeantes, en
              parallèle de la publication et de la déclaration de leur Index de l’égalité professionnelle.
            </p>
          </>
        }
      />
    </Container>
  </App>
);

export const Default = Template.bind({});
