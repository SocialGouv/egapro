import React, { FunctionComponent } from "react"

export type FooterBottomLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>

const FooterBottomLink: FunctionComponent<FooterBottomLinkProps> = ({ children, ...rest }) => {
  return (
    <a className="fr-footer__bottom-link" {...rest}>
      {children}
    </a>
  )
}

export default FooterBottomLink
