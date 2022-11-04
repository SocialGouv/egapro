import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { ButtonGroup, FormButton } from "@design-system";

export default {
  title: "Base/ButtonGroup",
  component: ButtonGroup,
} as ComponentMeta<typeof ButtonGroup>;

const Template: ComponentStory<typeof ButtonGroup> = args => (
  <ButtonGroup {...args}>
    <FormButton>button</FormButton>
    <FormButton>button</FormButton>
    <FormButton>button</FormButton>
  </ButtonGroup>
);

export const Default = Template.bind({});
