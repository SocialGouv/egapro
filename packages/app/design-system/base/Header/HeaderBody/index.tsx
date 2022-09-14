import React, { FunctionComponent } from "react"
import Link from "next/link"

import ButtonAsLink from "../../ButtonAsLink"
import Logo from "../../Logo"

export type HeaderBodyProps = {
  isMobileMenuOpen?: boolean;
  showMenuMobile: () => void;
  mobileMenuId: string
  buttonMobileMenuId: string
}

const HeaderBody: FunctionComponent<HeaderBodyProps> = ({isMobileMenuOpen,showMenuMobile,mobileMenuId,buttonMobileMenuId}) => {
  return (
    <div className="fr-header__body">
      <div className="fr-container">
        <div className="fr-header__body-row">
          <div className="fr-header__brand fr-enlarge-link">
            <div className="fr-header__brand-top">
              <div className="fr-header__logo">
                <Logo />
              </div>
              <div className="fr-header__navbar">
                <button
                  className="fr-btn--menu fr-btn"
                  data-fr-opened={isMobileMenuOpen}
                  aria-controls={mobileMenuId}
                  aria-haspopup="menu"
                  id={buttonMobileMenuId}
                  title="Menu"
                  onClick={showMenuMobile}
                >
                  Menu
                </button>
              </div>
            </div>
            <div className="fr-header__service">
              <Link href="/">
                <a
                  title="Accueil - Egapro - Ministère du Travail, de l’Emploi et de l’Insertion"
                >
                  <p className="fr-header__service-title">Egapro</p>
                </a>
              </Link>
              <p className="fr-header__service-tagline">
                Index de l’égalité professionnelle et répartition équilibrée femmes – hommes
              </p>
            </div>
          </div>
          <div className="fr-header__tools">
            <div className="fr-header__tools-links">
              <ul className="fr-btns-group">
                <li>
                  <Link href="/login" passHref>
                    <ButtonAsLink iconLeft="fr-icon-user-fill" variant="tertiary">
                      Se connecter
                    </ButtonAsLink>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeaderBody
