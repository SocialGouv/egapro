import { EntrepriseFooter } from "@components/Footers";
import { ButtonAsLink, FormButton, Logo, SkipLinks, SkipLinksItem } from "@design-system";
import { type TokenInfoType } from "@services/apiClient";
import { useFormManager, useUser } from "@services/apiClient";
import { clsx } from "clsx";
import Head from "next/head";
import { useRouter } from "next/router";
import { type PropsWithChildren } from "react";
import { useCallback, useEffect, useState } from "react";

import { NextLinkOrA } from "../../design-system/utils/NextLinkOrA";
import styles from "./App.module.css";

interface ActionButtonGroupsProps {
  dest: string;
  disconnectUser: VoidFunction;
  isAuthenticated: boolean;
  user: TokenInfoType | undefined;
}

const ActionButtonGroups = ({ dest, disconnectUser, isAuthenticated, user }: ActionButtonGroupsProps) => (
  <ul className="fr-btns-group">
    {isAuthenticated ? (
      <>
        <li>
          <ButtonAsLink href="/index-egapro/tableauDeBord/mon-profil" iconLeft="fr-icon-account-fill">
            {user?.email}
            {user?.staff ? " (staff)" : ""}
          </ButtonAsLink>
        </li>
        <li>
          <FormButton type="button" variant="secondary" iconLeft="fr-icon-lock-fill" onClick={disconnectUser}>
            Se déconnecter
          </FormButton>
        </li>
      </>
    ) : (
      <li>
        <ButtonAsLink
          href={`/representation-equilibree/email?redirectTo=${dest}`}
          type="button"
          variant="secondary"
          iconLeft="fr-icon-lock-fill"
        >
          Se connecter
        </ButtonAsLink>
      </li>
    )}
  </ul>
);

export interface AppProps {
  disableAuth?: boolean;
  footer?: React.ReactElement;
}
export const App = ({ children, footer = <EntrepriseFooter />, disableAuth }: PropsWithChildren<AppProps>) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuId = "mobile-menu";
  const buttonMobileMenuId = "button-mobile-menu";

  const { isAuthenticated, logout, user } = useUser();
  const { resetFormData } = useFormManager();

  const disconnectUser = () => {
    logout();
    resetFormData();
  };

  const setTheme = useCallback(() => {
    const askForDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = document.documentElement.getAttribute("data-fr-theme") === "dark";
    if (askForDark) {
      if (isDark) return;
      document.documentElement.setAttribute("data-fr-theme", "dark");
    } else {
      if (!isDark) return;
      document.documentElement.setAttribute("data-fr-theme", "light");
    }
  }, []);

  useEffect(() => {
    setTheme();
    const handleChange = () => setTheme();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handleChange);
    return function cleanup() {
      window.removeEventListener("change", handleChange);
    };
  }, [setTheme]);

  return (
    <>
      <Head>
        <meta
          name="description"
          content="Egapro permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression."
        />
      </Head>
      <div className={styles.app}>
        <SkipLinks>
          <SkipLinksItem href="#content">Contenu</SkipLinksItem>
          <SkipLinksItem href="#header">Menu</SkipLinksItem>
          <SkipLinksItem href="#footer">Pied de page</SkipLinksItem>
        </SkipLinks>
        <header role="banner" className="fr-header" id="header">
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
                        data-fr-opened={isMenuOpen}
                        aria-controls={mobileMenuId}
                        aria-haspopup="menu"
                        id={buttonMobileMenuId}
                        title="Menu"
                        onClick={() => setIsMenuOpen(true)}
                      >
                        Menu
                      </button>
                    </div>
                  </div>
                  <div className="fr-header__service">
                    <NextLinkOrA
                      href="/"
                      title="Accueil - Egapro - Ministère du Travail, de l’Emploi et de l’Insertion"
                    >
                      <p className="fr-header__service-title">Egapro</p>
                    </NextLinkOrA>
                    <p className="fr-header__service-tagline">
                      Index de l’égalité professionnelle et représentation équilibrée femmes – hommes
                    </p>
                  </div>
                </div>
                {!disableAuth && (
                  <div className="fr-header__tools">
                    <div className="fr-header__tools-links">
                      <ActionButtonGroups
                        dest={router.pathname}
                        isAuthenticated={isAuthenticated}
                        disconnectUser={disconnectUser}
                        user={user}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {!disableAuth && (
            <div className={clsx("fr-header__menu fr-modal", isMenuOpen && "fr-modal--opened")} id={mobileMenuId}>
              <div className="fr-container">
                <button
                  className="fr-btn--close fr-btn"
                  aria-controls={mobileMenuId}
                  title="Fermer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Fermer
                </button>
                <div className="fr-header__menu-links">
                  <ActionButtonGroups
                    dest={router.pathname}
                    isAuthenticated={isAuthenticated}
                    disconnectUser={disconnectUser}
                    user={user}
                  />
                </div>
              </div>
            </div>
          )}
        </header>
        <main role="main" id="content" className={styles.content}>
          {children}
        </main>
        {footer}
      </div>
    </>
  );
};
