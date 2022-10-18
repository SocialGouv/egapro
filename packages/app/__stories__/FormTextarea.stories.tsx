import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { FormTextarea } from "@design-system";

export default {
  title: "Base/Form/FormTextarea",
  component: FormTextarea,
} as ComponentMeta<typeof FormTextarea>;

const Template: ComponentStory<typeof FormTextarea> = args => <FormTextarea {...args} />;

export const Default = Template.bind({});
Default.args = {
  id: "xxx",
  placeholder: "Placeholder",
  isError: false,
  isValid: false,
  isDisabled: false,
};

export const IsError = Template.bind({});
IsError.args = { ...Default.args, isError: true, "aria-describedby": "id-of-error message" };

export const IsValid = Template.bind({});
IsValid.args = { ...Default.args, isValid: true };

export const IsDisabled = Template.bind({});
IsDisabled.args = { ...Default.args, isDisabled: true };
