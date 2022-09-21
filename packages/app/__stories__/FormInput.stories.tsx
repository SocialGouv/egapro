import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { FormInput } from "@/design-system";

export default {
  title: "Base/Form/FormInput",
  component: FormInput,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://gouvfr.atlassian.net/wiki/spaces/DB/pages/217088099/Champs+de+saisie+-+FormInput" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof FormInput>;

const Template: ComponentStory<typeof FormInput> = args => <FormInput {...args} />;

export const Default = Template.bind({});
Default.args = {
  id: "xxx",
  placeholder: "Placeholder",
  type: "text",
  isError: false,
  isValid: false,
  isDisabled: false,
  icon: undefined,
};

export const IsError = Template.bind({});
IsError.args = { ...Default.args, isError: true };

export const IsValid = Template.bind({});
IsValid.args = { ...Default.args, isValid: true };

export const IsDisabled = Template.bind({});
IsDisabled.args = { ...Default.args, isDisabled: true };

export const WithIcon = Template.bind({});
WithIcon.args = { ...Default.args, icon: "fr-icon-warning-line" };
