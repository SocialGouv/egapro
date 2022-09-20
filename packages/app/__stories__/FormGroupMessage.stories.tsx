import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { FormGroupMessage } from "../src/design-system";

export default {
  title: "Base/Form/FormGroupMessage",
  component: FormGroupMessage,
} as ComponentMeta<typeof FormGroupMessage>;

const Template: ComponentStory<typeof FormGroupMessage> = args => <FormGroupMessage {...args} />;

export const Default = Template.bind({});
Default.args = { children: "Texte d’état du champs de formulaire" };

export const IsError = Template.bind({});
IsError.args = { children: "Texte d’erreur obligatoire" };

export const IsValid = Template.bind({});
IsValid.args = { isValid: true, children: "Texte de validation" };
