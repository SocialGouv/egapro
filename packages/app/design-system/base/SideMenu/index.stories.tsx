import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import SideMenu from "./index"
import SideMenuItem from "./SideMenuItem"
import SideMenuLink from "./SideMenuLink"

export default {
  title: "Base/SideMenu",
  component: SideMenu,
} as ComponentMeta<typeof SideMenu>

const Template: ComponentStory<typeof SideMenu> = (args) => (
  <SideMenu {...args} />
)

export const Default = Template.bind({})
Default.args = {
  title:
    "Déclaration des écarts de représentation F/H dans les postes de direction",
  buttonLabel: "Dans cette rubrique",
  children: (
    <>
      <SideMenuItem isCurrent>
        <SideMenuLink href="#" isCurrent>
          Êtes-vous assujetti&nbsp;?
        </SideMenuLink>
        <SideMenuLink href="#" target="_self">
          Validation de l’email
        </SideMenuLink>
      </SideMenuItem>
    </>
  ),
}
