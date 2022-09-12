import React, { FunctionComponent } from "react"

export type FooterBottomItemProps = {}

const FooterBottomItem: FunctionComponent<FooterBottomItemProps> = ({ children }) => {
  return <li className="fr-footer__bottom-item">{children}</li>
}

export default FooterBottomItem
