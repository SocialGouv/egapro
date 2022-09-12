import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import FormLabel from "./index"

export default {
  title: "Base/Form/FormLabel",
  component: FormLabel,
} as ComponentMeta<typeof FormLabel>

const Template: ComponentStory<typeof FormLabel> = (args) => <FormLabel {...args} />

export const Default = Template.bind({})
Default.args = { children: "Label champ de saisie", htmlFor: "name" }

export const CustomDomNode = Template.bind({})
CustomDomNode.args = { ...Default.args, as: "legend" }

export const WithDescription = Template.bind({})
WithDescription.args = { ...Default.args, hint: "Texte de description additionnel" }
