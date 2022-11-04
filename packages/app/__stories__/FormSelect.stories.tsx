import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { FormSelect } from "@design-system";

export default {
  title: "Base/Form/FormSelect",
  component: FormSelect,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://gouvfr.atlassian.net/wiki/spaces/DB/pages/223019306/Liste+d+roulante+-+Select" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof FormSelect>;

const Template: ComponentStory<typeof FormSelect> = args => (
  <FormSelect {...args}>
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
    <option value="4">Option 4</option>
  </FormSelect>
);

export const Default = Template.bind({});
Default.args = {
  id: "xxx",
  placeholder: "Placeholder",
};

export const IsError = Template.bind({});
IsError.args = { ...Default.args, isError: true };

export const IsValid = Template.bind({});
IsValid.args = { ...Default.args, isValid: true };

export const IsDisabled = Template.bind({});
IsDisabled.args = { ...Default.args, isDisabled: true };
