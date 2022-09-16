import React, { FunctionComponent } from "react"

export type SideMenuLinkProps =
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    isCurrent?: boolean
  }

const SideMenuLink: FunctionComponent<SideMenuLinkProps> = ({
  isCurrent,
  children,
  ...rest
}) => {
  return (
    <a
      className="fr-sidemenu__link"
      aria-current={isCurrent ? "page" : undefined}
      target="_self"
      {...rest}
    >
      {children}
    </a>
  )
}

export default SideMenuLink
