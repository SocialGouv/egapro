import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { FormInput, FormGroup, FormLabel, FormGroupMessage } from "@/design-system";

export default {
  title: "Base/Form/FormGroup",
  component: FormGroup,
  subcomponent: { FormInput },
} as ComponentMeta<typeof FormGroup>;

const Template: ComponentStory<typeof FormGroup> = args => (
  <FormGroup {...args}>
    <FormLabel htmlFor="xxx">Label champ de saisie</FormLabel>
    <FormInput id="xxx" isValid={args.isValid} isError={args.isError} />
    {args.isError && <FormGroupMessage id="xxx">Texte d’erreur obligatoire</FormGroupMessage>}
    {args.isValid && (
      <FormGroupMessage id="xxx" isValid>
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
