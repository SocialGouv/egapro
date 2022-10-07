import type { ComponentStory, ComponentMeta } from "@storybook/react";

import {
  App,
  Container,
  ContentWithAside,
  ContentWithAsideMain,
  ContentWithAsideSideMenu,
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormSelect,
  SideMenu,
  SideMenuLink,
  SideMenuList,
  SideMenuTitle,
} from "@/design-system";

export default {
  title: "Layout/App",
  component: App,
} as ComponentMeta<typeof App>;

const Template: ComponentStory<typeof App> = () => (
  <App>
    <Container>
      <ContentWithAside>
        <ContentWithAsideSideMenu>
          <SideMenu buttonLabel={"Dans cette rubrique"}>
            <SideMenuTitle>Déclaration des écarts de représentation F/H dans les postes de direction</SideMenuTitle>
            <SideMenuList>
              <SideMenuLink href="#" isCurrent>
                Êtes-vous assujetti&nbsp;?
              </SideMenuLink>
              <SideMenuLink href="#" target="_self">
                Validation de l’email
              </SideMenuLink>
            </SideMenuList>
          </SideMenu>
        </ContentWithAsideSideMenu>
        <ContentWithAsideMain>
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
          <FormLayout>
            <FormGroup>
              <FormGroupLabel htmlFor="xxx">Label champ de saisie</FormGroupLabel>
              <FormInput id="xxx" />
            </FormGroup>
            <FormGroup>
              <FormGroupLabel htmlFor="yyy">Label champ de saisie</FormGroupLabel>
              <FormInput id="yyy" />
            </FormGroup>
            <FormGroupLabel htmlFor="zzz">Label champ de saisie</FormGroupLabel>
            <FormSelect id="zzz">
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
              <option value="3">Option 3</option>
              <option value="4">Option 4</option>
            </FormSelect>
            <FormLayoutButtonGroup>
              <FormButton variant="tertiary">button</FormButton>
              <FormButton>button</FormButton>
            </FormLayoutButtonGroup>
          </FormLayout>
        </ContentWithAsideMain>
      </ContentWithAside>
    </Container>
  </App>
);

export const Default = Template.bind({});
