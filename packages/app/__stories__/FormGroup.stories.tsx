import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { FormInput, FormGroup, FormSelect, FormGroupLabel, FormGroupMessage } from "@design-system";

export default {
  title: "Base/Form/FormGroup",
  component: FormGroup,
} as ComponentMeta<typeof FormGroup>;

const Template: ComponentStory<typeof FormGroup> = args => (
  <FormGroup {...args}>
    <FormGroupLabel htmlFor="xxx">Label champ de saisie</FormGroupLabel>
    <FormInput
      aria-describedby={args.isValid || args.isError ? "xxx-msg" : undefined}
      id="xxx"
      isValid={args.isValid}
      isError={args.isError}
    />
    {args.isError && <FormGroupMessage id="xxx-msg">Texte d’erreur obligatoire</FormGroupMessage>}
    {args.isValid && (
      <FormGroupMessage id="xxx-msg" isValid>
        Texte de validation
      </FormGroupMessage>
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
    <FormGroupLabel htmlFor="xxx">Label champ de saisie</FormGroupLabel>
    <FormSelect id="xxx" isValid={args.isValid} isError={args.isError}>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
      <option value="3">Option 3</option>
      <option value="4">Option 4</option>
    </FormSelect>
    {args.isError && <FormGroupMessage id="xxx">Texte d’erreur obligatoire</FormGroupMessage>}
    {args.isValid && (
      <FormGroupMessage id="xxx" isValid>
        Texte de validation
      </FormGroupMessage>
    )}
  </FormGroup>
);
