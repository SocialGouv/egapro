import { FormButton } from "@design-system";
import { action } from "@storybook/addon-actions";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Base/Form/FormButton",
  component: FormButton,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/composants/bouton/" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof FormButton>;

const Template: ComponentStory<typeof FormButton> = args => <FormButton onClick={action("button-click")} {...args} />;

export const Default = Template.bind({});
Default.args = { children: "FormButton" };

export const WithSize = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
    <FormButton size="sm" onClick={action("button-click")}>
      FormButton
    </FormButton>
    <FormButton onClick={action("button-click")}>FormButton</FormButton>
    <FormButton size="lg" onClick={action("button-click")}>
      FormButton
    </FormButton>
  </div>
);

export const WithVariant = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <FormButton onClick={action("button-click")}>FormButton</FormButton>
    <FormButton variant="secondary" onClick={action("button-click")}>
      FormButton
    </FormButton>
    <FormButton variant="tertiary" onClick={action("button-click")}>
      FormButton
    </FormButton>
    <FormButton variant="tertiary-no-outline" onClick={action("button-click")}>
      FormButton
    </FormButton>
  </div>
);

export const WithIcon = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <FormButton onClick={action("button-click")} iconLeft="fr-icon-user-fill">
      FormButton
    </FormButton>
    <FormButton onClick={action("button-click")} iconRight="fr-icon-user-fill">
      FormButton
    </FormButton>
    <FormButton onClick={action("button-click")} iconOnly="fr-icon-user-fill">
      FormButton
    </FormButton>
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
    <FormButton onClick={action("button-click")} isDisabled>
      FormButton
    </FormButton>
    <FormButton variant="secondary" onClick={action("button-click")} isDisabled>
      FormButton
    </FormButton>
    <FormButton variant="tertiary" onClick={action("button-click")} isDisabled>
      FormButton
    </FormButton>
    <FormButton variant="tertiary-no-outline" onClick={action("button-click")} isDisabled>
      FormButton
    </FormButton>
  </div>
);
