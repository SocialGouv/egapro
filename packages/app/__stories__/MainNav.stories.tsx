import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { MainNav, MainNavItem } from "@design-system";

export default {
  title: "Base/MainNav",
  component: MainNav,
} as ComponentMeta<typeof MainNav>;

const Template: ComponentStory<typeof MainNav> = () => (
  <MainNav>
    <MainNavItem href="/">Accueil</MainNavItem>
    <MainNavItem href="/index-egapro">Calcul d'index</MainNavItem>
    <MainNavItem href="/representation-equilibree">Représentation équilibrée</MainNavItem>
  </MainNav>
);

export const Default = Template.bind({});
Default.args = {};
