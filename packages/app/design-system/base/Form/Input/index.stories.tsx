import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import Input from "./index"

export default {
  title: "Base/Form/Input",
  component: Input,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://gouvfr.atlassian.net/wiki/spaces/DB/pages/217088099/Champs+de+saisie+-+Input" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof Input>

const Template: ComponentStory<typeof Input> = (args) => <Input {...args} />

export const Default = Template.bind({})
Default.args = {
  id: "xxx",
  placeholder: "Placeholder",
  type: "text",
  isError: false,
  isValid: false,
  isDisabled: false,
  icon: undefined,
}

export const IsError = Template.bind({})
IsError.args = { ...Default.args, isError: true }

export const IsValid = Template.bind({})
IsValid.args = { ...Default.args, isValid: true }

export const IsDisabled = Template.bind({})
IsDisabled.args = { ...Default.args, isDisabled: true }

export const WithIcon = Template.bind({})
WithIcon.args = { ...Default.args, icon: "fr-icon-warning-line" }
