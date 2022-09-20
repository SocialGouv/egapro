import React, { FunctionComponent } from "react"
import clsx from "clsx"

export type SideMenuItemProps = {
  isCurrent?: boolean
}

export const SideMenuItem: FunctionComponent<SideMenuItemProps> = ({ isCurrent, children }) => {
  return <li className={clsx("fr-sidemenu__item", isCurrent && "fr-sidemenu__item--active")}>{children}</li>
}
