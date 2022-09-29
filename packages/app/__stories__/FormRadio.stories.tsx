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

export const Default = Template.bind({});

export const Small: ComponentStory<typeof FormRadioGroup> = args => {
  return (
    <FormRadioGroup {...args}>
      <FormRadioGroup.Legend id="legendId">Légende</FormRadioGroup.Legend>
      <FormRadioGroup.Input id="inputId1" size="sm">
        radio 1
      </FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId2" size="sm">
        radio 2
      </FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId3" size="sm">
        radio 3
      </FormRadioGroup.Input>
    </FormRadioGroup>
  );
};

export const Valid: ComponentStory<typeof FormRadioGroup> = args => {
  return (
    <FormRadioGroup isValid {...args}>
      <FormRadioGroup.Legend id="legendId">Légende</FormRadioGroup.Legend>
      <FormRadioGroup.Input id="inputId1" size="sm">
        radio 1
      </FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId2" size="sm">
        radio 2
      </FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId3" size="sm">
        radio 3
      </FormRadioGroup.Input>
      <FormRadioGroup.ValidationMessage isValid>Validé</FormRadioGroup.ValidationMessage>
    </FormRadioGroup>
  );
};

export const Error: ComponentStory<typeof FormRadioGroup> = args => {
  return (
    <FormRadioGroup isError {...args}>
      <FormRadioGroup.Legend id="legendId">Légende</FormRadioGroup.Legend>
      <FormRadioGroup.Input id="inputId1" size="sm">
        radio 1
      </FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId2" size="sm">
        radio 2
      </FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId3" size="sm">
        radio 3
      </FormRadioGroup.Input>
      <FormRadioGroup.ValidationMessage isError>Error</FormRadioGroup.ValidationMessage>
    </FormRadioGroup>
  );
};
