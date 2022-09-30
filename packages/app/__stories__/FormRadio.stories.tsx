import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { FormRadioGroup } from "@/design-system";

export default {
  title: "Base/FormRadioGroup",
  component: FormRadioGroup,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://gouvfr.atlassian.net/wiki/spaces/DB/pages/217088553/Boutons+radio+-+Radio+button" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof FormRadioGroup>;

const Template: ComponentStory<typeof FormRadioGroup> = args => (
  <FormRadioGroup {...args}>
    <FormRadioGroup.Legend id="legendId">Légende</FormRadioGroup.Legend>
    <FormRadioGroup.Input id="inputId1">radio 1</FormRadioGroup.Input>
    <FormRadioGroup.Input id="inputId2">radio 2</FormRadioGroup.Input>
    <FormRadioGroup.Input id="inputId3">radio 3</FormRadioGroup.Input>
  </FormRadioGroup>
);

export const Default = Template.bind({ size: "md" });

export const SizeSm = Template.bind({});
SizeSm.args = {
  ...Default.args,
  size: "sm",
  inline: false,
};

export const Inline = Template.bind({});
Inline.args = {
  ...Default.args,
  inline: true,
};

export const IsValid: ComponentStory<typeof FormRadioGroup> = args => {
  return (
    <FormRadioGroup isValid ariaLabelledby="legendId xxxx" {...args}>
      <FormRadioGroup.Legend id="legendId">Légende</FormRadioGroup.Legend>
      <FormRadioGroup.Input id="inputId1">radio 1</FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId2">radio 2</FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId3">radio 3</FormRadioGroup.Input>
      <FormRadioGroup.ValidationMessage isValid id="xxxx">
        Validé
      </FormRadioGroup.ValidationMessage>
    </FormRadioGroup>
  );
};

export const IsError: ComponentStory<typeof FormRadioGroup> = args => {
  return (
    <FormRadioGroup isError ariaLabelledby="legendId oooo" {...args}>
      <FormRadioGroup.Legend id="legendId">Légende</FormRadioGroup.Legend>
      <FormRadioGroup.Input id="inputId1">radio 1</FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId2">radio 2</FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId3">radio 3</FormRadioGroup.Input>
      <FormRadioGroup.ValidationMessage isError id="oooo">
        Error
      </FormRadioGroup.ValidationMessage>
    </FormRadioGroup>
  );
};
