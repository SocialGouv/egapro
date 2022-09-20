import clsx from "clsx";
import Link from "next/link";
import type { FunctionComponent } from "react";

import { ButtonAsLink } from "./ButtonAsLink";

export type HeaderMobileMenuProps = {
  buttonMobileMenuId: string;
  closeMenuMobile: () => void;
  isMobileMenuOpen?: boolean;
  mobileMenuId: string;
};

export const HeaderMobileMenu: FunctionComponent<HeaderMobileMenuProps> = ({
  isMobileMenuOpen,
  closeMenuMobile,
  mobileMenuId,
  buttonMobileMenuId,
}) => {
  return (
    <div
      className={clsx("fr-header__menu fr-modal", isMobileMenuOpen && "fr-modal--opened")}
      id={mobileMenuId}
      aria-labelledby={buttonMobileMenuId}
    >
      <div className="fr-container">
        <button className="fr-btn--close fr-btn" aria-controls={mobileMenuId} title="Fermer" onClick={closeMenuMobile}>
          Fermer
        </button>
        <div className="fr-header__menu-links">
          <ul className="fr-btns-group">
            <li>
              <Link href="/login" passHref>
                <ButtonAsLink iconLeft="fr-icon-user-fill">Se connecter</ButtonAsLink>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
