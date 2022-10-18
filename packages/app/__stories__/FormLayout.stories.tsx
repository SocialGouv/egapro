import type { ComponentStory, ComponentMeta } from "@storybook/react";

import {
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormSelect,
} from "@design-system";

export default {
  title: "Layout/FormLayout",
  component: FormLayout,
} as ComponentMeta<typeof FormLayout>;

const Template: ComponentStory<typeof FormLayout> = args => (
  <FormLayout {...args}>
    <FormGroup>
      <FormGroupLabel htmlFor="xxx">Label champ de saisie</FormGroupLabel>
      <FormInput id="xxx" />
    </FormGroup>
    <FormGroup>
      <FormGroupLabel htmlFor="yyy">Label champ de saisie</FormGroupLabel>
      <FormInput id="yyy" />
      <FormGroupMessage id="yyy">Texte d’erreur obligatoire</FormGroupMessage>
    </FormGroup>
    <FormGroupLabel htmlFor="zzz">Label champ de saisie</FormGroupLabel>
    <FormSelect id="zzz">
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
      <option value="3">Option 3</option>
      <option value="4">Option 4</option>
    </FormSelect>
    <FormLayoutButtonGroup>
      <FormButton>button</FormButton>
      <FormButton>button</FormButton>
      <FormButton>button</FormButton>
    </FormLayoutButtonGroup>
  </FormLayout>
);

export const Default = Template.bind({});
