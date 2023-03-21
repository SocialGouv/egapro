import { ButtonAsLink } from "@design-system";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Base/ButtonAsLink",
  component: ButtonAsLink,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/composants/bouton/" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof ButtonAsLink>;

const Template: ComponentStory<typeof ButtonAsLink> = args => <ButtonAsLink href="#" {...args} />;

export const Default = Template.bind({});
Default.args = { children: "Button" };

export const WithSize = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
    <ButtonAsLink href="#" size="sm">
      Button
    </ButtonAsLink>
    <ButtonAsLink href="#">Button</ButtonAsLink>
    <ButtonAsLink href="#" size="lg">
      Button
    </ButtonAsLink>
  </div>
);

export const WithVariant = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <ButtonAsLink href="#">Button</ButtonAsLink>
    <ButtonAsLink href="#" variant="secondary">
      Button
    </ButtonAsLink>
    <ButtonAsLink href="#" variant="tertiary">
      Button
    </ButtonAsLink>
    <ButtonAsLink href="#" variant="tertiary-no-outline">
      Button
    </ButtonAsLink>
  </div>
);

export const WithIcon = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <ButtonAsLink href="#" iconLeft="fr-icon-user-fill">
      Button
    </ButtonAsLink>
    <ButtonAsLink href="#" iconRight="fr-icon-user-fill">
      Button
    </ButtonAsLink>
    <ButtonAsLink href="#" iconOnly="fr-icon-user-fill">
      Button
    </ButtonAsLink>
  </div>
);
WithIcon.parameters = {
  docs: {
    description: {
      story: `Liste des icônes disponibles : <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/fondamentaux-techniques/icones" target="_blank">voir la liste officielle</a>`,
    },
  },
};

export const IsDisabled = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <ButtonAsLink isDisabled>Button</ButtonAsLink>
    <ButtonAsLink variant="secondary" isDisabled>
      Button
    </ButtonAsLink>
    <ButtonAsLink variant="tertiary" isDisabled>
      Button
    </ButtonAsLink>
    <ButtonAsLink variant="tertiary-no-outline" isDisabled>
      Button
    </ButtonAsLink>
  </div>
);
