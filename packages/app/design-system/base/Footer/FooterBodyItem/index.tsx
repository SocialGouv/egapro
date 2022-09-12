import React, { FunctionComponent } from "react"

export type FooterBodyItemProps = {}

const FooterBodyItem: FunctionComponent<FooterBodyItemProps> = ({ children }) => {
  return <li className="fr-footer__content-item">{children}</li>
}

export default FooterBodyItem
