import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { FormInput, FormGroup, FormSelect } from "@/design-system";

export default {
  title: "Base/Form/FormGroup",
  component: FormGroup,
  subcomponent: { FormInput },
} as ComponentMeta<typeof FormGroup>;

const Template: ComponentStory<typeof FormGroup> = args => (
  <FormGroup {...args}>
    <FormGroup.Label htmlFor="xxx">Label champ de saisie</FormGroup.Label>
    <FormInput id="xxx" isValid={args.isValid} isError={args.isError} />
    {args.isError && <FormGroup.Message id="xxx">Texte d’erreur obligatoire</FormGroup.Message>}
    {args.isValid && (
      <FormGroup.Message id="xxx" isValid>
        Texte de validation
      </FormGroup.Message>
    )}
  </FormGroup>
);

export const Default = Template.bind({});
Default.args = {
  isValid: false,
  isError: false,
};

export const IsValid = Template.bind({});
IsValid.args = {
  isValid: true,
};

export const IsError = Template.bind({});
IsError.args = {
  isError: true,
};

export const WithFormSelect: ComponentStory<typeof FormGroup> = args => (
  <FormGroup {...args}>
    <FormGroup.Label htmlFor="xxx">Label champ de saisie</FormGroup.Label>
    <FormSelect id="xxx" isValid={args.isValid} isError={args.isError}>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
      <option value="3">Option 3</option>
      <option value="4">Option 4</option>
    </FormSelect>
    {args.isError && <FormGroup.Message id="xxx">Texte d’erreur obligatoire</FormGroup.Message>}
    {args.isValid && (
      <FormGroup.Message id="xxx" isValid>
        Texte de validation
      </FormGroup.Message>
    )}
  </FormGroup>
);
