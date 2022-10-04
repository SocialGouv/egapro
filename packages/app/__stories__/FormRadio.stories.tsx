import type { ComponentStory, ComponentMeta } from "@storybook/react";
import {
  FormRadioGroup,
  FormRadioGroupContent,
  FormRadioGroupInput,
  FormRadioGroupLegend,
  FormRadioGroupValidationMessage,
} from "@/design-system";

export default {
  title: "Base/Form/FormRadioGroup",
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
    <FormRadioGroupLegend id="legendId">Légende</FormRadioGroupLegend>
    <FormRadioGroupContent>
      <FormRadioGroupInput id="inputId1">radio 1</FormRadioGroupInput>
      <FormRadioGroupInput id="inputId2">radio 2</FormRadioGroupInput>
      <FormRadioGroupInput id="inputId3">radio 3</FormRadioGroupInput>
    </FormRadioGroupContent>
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
      <FormRadioGroupLegend id="legendId">Légende</FormRadioGroupLegend>
      <FormRadioGroupContent>
        <FormRadioGroupInput id="inputId1">radio 1</FormRadioGroupInput>
        <FormRadioGroupInput id="inputId2">radio 2</FormRadioGroupInput>
        <FormRadioGroupInput id="inputId3">radio 3</FormRadioGroupInput>
      </FormRadioGroupContent>
      <FormRadioGroupValidationMessage isValid id="xxxx">
        Validé
      </FormRadioGroupValidationMessage>
    </FormRadioGroup>
  );
};

export const IsError: ComponentStory<typeof FormRadioGroup> = args => {
  return (
    <FormRadioGroup isError ariaLabelledby="legendId oooo" {...args}>
      <FormRadioGroupLegend id="legendId">Légende</FormRadioGroupLegend>
      <FormRadioGroupContent>
        <FormRadioGroupInput id="inputId1">radio 1</FormRadioGroupInput>
        <FormRadioGroupInput id="inputId2">radio 2</FormRadioGroupInput>
        <FormRadioGroupInput id="inputId3">radio 3</FormRadioGroupInput>
      </FormRadioGroupContent>
      <FormRadioGroupValidationMessage isError id="oooo">
        Error
      </FormRadioGroupValidationMessage>
    </FormRadioGroup>
  );
};
