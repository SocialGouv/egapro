import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import SideMenu from "."

export default {
  title: "Base/SideMenu",
  component: SideMenu,
} as ComponentMeta<typeof SideMenu>

const Template: ComponentStory<typeof SideMenu> = (args) => (
  <SideMenu {...args} />
)

export const Default = Template.bind({})
Default.args = {
  title: "Titre de rubrique",
  buttonLabel: "Dans cette rubrique",
  children: "children",
}
