import React, { FunctionComponent } from "react"

export type FooterBodyProps = {
  logo: React.ReactNode
  description: string
  items?: React.ReactNode
}

export const FooterBody: FunctionComponent<FooterBodyProps> = ({ logo, description, items }) => {
  return (
    <div className="fr-footer__body">
      <div className="fr-footer__brand fr-enlarge-link">{logo}</div>
      <div className="fr-footer__content">
        <p className="fr-footer__content-desc">{description}</p>
        {items && <ul className="fr-footer__content-list">{items}</ul>}
      </div>
    </div>
  )
}
