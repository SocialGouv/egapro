import React, { FunctionComponent, useState } from "react"

import HeaderBody from "./HeaderBody"
import HeaderMobileMenu from "./HeaderMobileMenu"

export type HeaderProps = {}

const Header: FunctionComponent<HeaderProps> = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const mobileMenuId = "mobile-menu"
  const buttonMobileMenuId = "button-mobile-menu"
  return (
    <header role="banner" className="fr-header" id="header">
      <HeaderBody
        mobileMenuId={mobileMenuId}
        isMobileMenuOpen={isMenuOpen}
        buttonMobileMenuId={buttonMobileMenuId}
        showMenuMobile={() => setIsMenuOpen(true)}
      />
      <HeaderMobileMenu
        mobileMenuId={mobileMenuId}
        buttonMobileMenuId={buttonMobileMenuId}
        isMobileMenuOpen={isMenuOpen}
        closeMenuMobile={() => setIsMenuOpen(false)}
      />
    </header>
  )
}

export default Header
