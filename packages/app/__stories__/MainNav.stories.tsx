import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { MainNav, MainNavItem } from "@/design-system";

export default {
  title: "Base/MainNav",
  component: MainNav,
} as ComponentMeta<typeof MainNav>;

const Template: ComponentStory<typeof MainNav> = () => (
  <MainNav>
    <MainNavItem href="/" isCurrent>
      Accueil
    </MainNavItem>
    <MainNavItem href="/index">Calcul d'index</MainNavItem>
    <MainNavItem href="/ecart-rep">Représentation équilibrée</MainNavItem>
  </MainNav>
);

export const Default = Template.bind({});
Default.args = {};
