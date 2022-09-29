import Link from "next/link";
import { useRouter } from "next/router";
import type { FunctionComponent } from "react";

import { FormButton } from "./FormButton";
import { Logo } from "./Logo";
import { useUser } from "@components/AuthContext";

export type HeaderBodyProps = {
  buttonMobileMenuId: string;
  isMobileMenuOpen?: boolean;
  mobileMenuId: string;
  showMenuMobile: () => void;
};

export const HeaderBody: FunctionComponent<HeaderBodyProps> = ({
  isMobileMenuOpen,
  showMenuMobile,
  mobileMenuId,
  buttonMobileMenuId,
}) => {
  const { isAuthenticated, logout } = useUser();
  const router = useRouter();

  const disconnectUser = () => {
    logout();
    router.push("/ecart-rep/email");
  };

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
                <a title="Accueil - Egapro - Ministère du Travail, de l’Emploi et de l’Insertion">
                  <p className="fr-header__service-title">Egapro</p>
                </a>
              </Link>
              <p className="fr-header__service-tagline">
                Index de l’égalité professionnelle et répartition équilibrée femmes – hommes
              </p>
            </div>
          </div>
          {isAuthenticated && (
            <div className="fr-header__tools">
              <div className="fr-header__tools-links">
                <ul className="fr-btns-group">
                  <li>
                    <FormButton variant="secondary" onClick={disconnectUser}>
                      Se déconnecter
                    </FormButton>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
