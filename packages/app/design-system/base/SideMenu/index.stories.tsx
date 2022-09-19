import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import SideMenu from "./index"
import SideMenuItem from "./SideMenuItem"
import SideMenuLink from "./SideMenuLink"

export default {
  title: "Base/SideMenu",
  component: SideMenu,
} as ComponentMeta<typeof SideMenu>

const Template: ComponentStory<typeof SideMenu> = (args) => <SideMenu {...args} />

export const Default = Template.bind({})
Default.args = {
  title: "Déclaration des écarts de représentation F/H dans les postes de direction",
  buttonLabel: "Dans cette rubrique",
  children: (
    <>
      <SideMenuItem isCurrent>
        <SideMenuLink href="#" isCurrent>
          Êtes-vous assujetti&nbsp;?
        </SideMenuLink>
      </SideMenuItem>
      <SideMenuItem>
        <SideMenuLink href="#" target="_self">
          Validation de l’email
        </SideMenuLink>
      </SideMenuItem>
      <li className="fr-sidemenu__item">
        <button className="fr-sidemenu__btn" aria-expanded="false" aria-controls="fr-sidemenu-item-0">
          Niveau 1
        </button>
        <div className="fr-collapse" id="fr-sidemenu-item-0">
          <ul className="fr-sidemenu__list">
            <li className="fr-sidemenu__item">
              <a className="fr-sidemenu__link" href="#" target="_self">
                Accès direct niveau 2
              </a>
            </li>
            <li className="fr-sidemenu__item">
              <a className="fr-sidemenu__link" href="#" target="_self">
                Accès direct niveau 2
              </a>
            </li>
            <li className="fr-sidemenu__item">
              <a className="fr-sidemenu__link" href="#" target="_self">
                Accès direct niveau 2
              </a>
            </li>
            <li className="fr-sidemenu__item">
              <a className="fr-sidemenu__link" href="#" target="_self">
                Accès direct niveau 2
              </a>
            </li>
            <li className="fr-sidemenu__item">
              <a className="fr-sidemenu__link" href="#" target="_self">
                Accès direct niveau 2
              </a>
            </li>
            <li className="fr-sidemenu__item">
              <a className="fr-sidemenu__link" href="#" target="_self">
                Accès direct niveau 2
              </a>
            </li>
          </ul>
        </div>
      </li>
    </>
  ),
}
