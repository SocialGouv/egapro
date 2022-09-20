import React, { FunctionComponent } from "react"

export type FooterBodyItemProps = {}

export const FooterBodyItem: FunctionComponent<FooterBodyItemProps> = ({ children }) => {
  return <li className="fr-footer__content-item">{children}</li>
}
