import React from "react"

import { FooterBody } from "./FooterBody"
import { FooterBodyItem } from "./FooterBodyItem"
import { FooterBottom } from "./FooterBottom"
import { FooterBottomItem } from "./FooterBottomItem"
import { FooterBottomLink } from "./FooterBottomLink"
import { FooterContentLink } from "./FooterContentLink"
import { Logo } from "./Logo"

export const Footer = () => {
  return (
    <footer className="fr-footer" role="contentinfo" id="footer">
      <div className="fr-container">
        <FooterBody
          logo={
            <a href="#">
              <Logo />
            </a>
          }
          description="Représentation Équilibrée a été développé par les équipes de la fabrique numérique des ministères sociaux."
          items={
            <>
              <FooterBodyItem>
                <FooterContentLink href="https://legifrance.gouv.fr" target="_blank" rel="noreferrer">
                  legifrance.gouv.fr
                </FooterContentLink>
              </FooterBodyItem>
              <FooterBodyItem>
                <FooterContentLink href="https://legifrance.gouv.fr" target="_blank" rel="noreferrer">
                  legifrance.gouv.fr
                </FooterContentLink>
              </FooterBodyItem>
            </>
          }
        />
        <FooterBottom>
          <>
            <FooterBottomItem>
              <FooterBottomLink href="https://legifrance.gouv.fr">Plan du site</FooterBottomLink>
            </FooterBottomItem>
            <FooterBottomItem>
              <FooterBottomLink href="https://legifrance.gouv.fr">Mentions légales</FooterBottomLink>
            </FooterBottomItem>
          </>
        </FooterBottom>
      </div>
    </footer>
  )
}
