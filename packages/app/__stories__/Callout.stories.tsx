import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { Callout } from "@/design-system";

export default {
  title: "Base/Callout",
  component: Callout,
  argTypes: {
    titleSize: {
      options: ["lg", "md", "sm", "xl", "xs"],
      control: { type: "radio" },
    },
  },
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://gouvfr.atlassian.net/wiki/spaces/DB/pages/222331196/Mise+en+avant+-+Call+out" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof Callout>;

const Template: ComponentStory<typeof Callout> = args => (
  <Callout {...args}>
    Les parents d’enfants de 11 à 14 ans n’ont aucune démarche à accomplir : les CAF versent automatiquement l’ARS aux
    familles déjà allocataires qui remplissent les conditions.
  </Callout>
);

export const Default = Template.bind({});
Default.args = {
  id: "xxx",
  buttonLabel: "Cliquer ici",
  title: "Small title",
  titleSize: "sm",
};

export const Colored = Template.bind({});
Colored.args = {
  id: "xxx",
  title: "Extra small title",
  titleSize: "xs",
  color: "green-emeraude",
};

export const Cta = Template.bind({});
Cta.args = {
  id: "xxx",
  buttonLabel: "Cliquer là",
  title: "With CTA",
  titleSize: "xs",
  color: "brown-caramel",
  cta: () => {
    alert("Yo");
  },
};
