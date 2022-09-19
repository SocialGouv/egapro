import React, { FunctionComponent } from "react"
import clsx from "clsx"

export type SideMenuProps = {
  isCurrent?: boolean
}

const SideMenu: FunctionComponent<SideMenuProps> = ({
  isCurrent,
  children,
}) => {
  return (
    <li
      className={clsx(
        "fr-sidemenu__item",
        isCurrent && "fr-sidemenu__item--active"
      )}
    >
      {children}
    </li>
  )
}

export default SideMenu
