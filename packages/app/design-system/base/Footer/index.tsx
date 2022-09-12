import React, { FunctionComponent } from "react"

export type FooterProps = {}

const Footer: FunctionComponent<FooterProps> = ({ children }) => {
  return (
    <footer className="fr-footer" role="contentinfo" id="footer">
      <div className="fr-container">{children}</div>
    </footer>
  )
}

export default Footer
