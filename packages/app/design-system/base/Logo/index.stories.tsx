import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import Logo from "./index"

export default {
  title: "Base/Logo",
  component: Logo,
} as ComponentMeta<typeof Logo>

const Template: ComponentStory<typeof Logo> = (args) => <Logo {...args} />

export const Default = Template.bind({})
Default.args = {}
