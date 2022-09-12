import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import Input from "../Input"
import FormGroup from "./index"
import FormLabel from "../FormLabel"
import FormGroupMessage from "../FormGroupMessage"

export default {
  title: "Base/Form/FormGroup",
  component: FormGroup,
  subcomponent: { Input },
} as ComponentMeta<typeof FormGroup>

const Template: ComponentStory<typeof FormGroup> = (args) => (
  <FormGroup {...args}>
    <FormLabel htmlFor="xxx">Label champ de saisie</FormLabel>
    <Input id="xxx" isValid={args.isValid} isError={args.isError} />
    {args.isError && <FormGroupMessage id="xxx">Texte d’erreur obligatoire</FormGroupMessage>}
    {args.isValid && (
      <FormGroupMessage id="xxx" isValid>
        Texte de validation
      </FormGroupMessage>
    )}
  </FormGroup>
)

export const Default = Template.bind({})
Default.args = {
  isValid: false,
  isError: false,
}

export const IsValid = Template.bind({})
IsValid.args = {
  isValid: true,
}

export const IsError = Template.bind({})
IsError.args = {
  isError: true,
}
