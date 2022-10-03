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

export const Default: ComponentStory<typeof Callout> = () => {
  return (
    <Callout>
      <Callout.Description>
        Les parents d’enfants de 11 à 14 ans n’ont aucune démarche à accomplir : les CAF versent automatiquement l’ARS
        aux familles déjà allocataires qui remplissent les conditions.
      </Callout.Description>
    </Callout>
  );
};

export const WithIcon: ComponentStory<typeof Callout> = () => {
  return (
    <Callout icon="fr-fi-information-line">
      <Callout.Description>
        Les parents d’enfants de 11 à 14 ans n’ont aucune démarche à accomplir : les CAF versent automatiquement l’ARS
        aux familles déjà allocataires qui remplissent les conditions.
      </Callout.Description>
    </Callout>
  );
};

export const WithTitle: ComponentStory<typeof Callout> = () => {
  return (
    <Callout icon="fr-fi-information-line">
      <Callout.Title>Titre mise en avant</Callout.Title>
      <Callout.Description>
        Les parents d’enfants de 11 à 14 ans n’ont aucune démarche à accomplir : les CAF versent automatiquement l’ARS
        aux familles déjà allocataires qui remplissent les conditions.
      </Callout.Description>
    </Callout>
  );
};

export const WithButton: ComponentStory<typeof Callout> = () => {
  return (
    <Callout icon="fr-fi-information-line">
      <Callout.Title>Titre mise en avant</Callout.Title>
      <Callout.Description>
        Les parents d’enfants de 11 à 14 ans n’ont aucune démarche à accomplir : les CAF versent automatiquement l’ARS
        aux familles déjà allocataires qui remplissent les conditions.
      </Callout.Description>
      <Callout.Button onClick={action("button-click")}>Cliquer là</Callout.Button>
    </Callout>
  );
};
