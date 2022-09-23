import { action } from "@storybook/addon-actions";
import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { Callout } from "@/design-system";

export default {
  title: "Base/Callout",
  component: Callout,
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
Default.args = {};

export const WithIcon = Template.bind({});
WithIcon.args = {
  icon: "fr-fi-information-line",
};

export const WithTitle = Template.bind({});
WithTitle.args = {
  title: "Titre mise en avant",
  icon: "fr-fi-information-line",
};

export const WithButton = Template.bind({});
WithButton.args = {
  icon: "fr-fi-information-line",
  title: "Titre mise en avant",
  buttonLabel: "Cliquer là",
  buttonOnClick: action("button-click"),
};
