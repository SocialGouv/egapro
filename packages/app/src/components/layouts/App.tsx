import clsx from "clsx";
import Head from "next/head";
import NextLink from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import styles from "./App.module.css";
import {
  Footer,
  FooterBody,
  FooterBodyBrand,
  FooterBodyContent,
  FooterBodyContentDescription,
  FooterBodyContentItems,
  FooterBodyItem,
  FooterBottom,
  FooterBottomItem,
  FooterBottomLink,
  FooterContentLink,
  Logo,
  SkipLinks,
  SkipLinksItem,
} from "@design-system";
import { FormButton } from "@design-system";
import { useFormManager, useUser } from "@services/apiClient";

// TODO move to _app.tsx when migration is done
// TODO explode FooterBody component here
export const App = ({ children }: PropsWithChildren) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuId = "mobile-menu";
  const buttonMobileMenuId = "button-mobile-menu";

  const { isAuthenticated, logout } = useUser();
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
        <title>Egapro</title>
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
                    {isAuthenticated && (
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
                    )}
                  </div>
                  <div className="fr-header__service">
                    <NextLink href="/">
                      <a title="Accueil - Egapro - Ministère du Travail, de l’Emploi et de l’Insertion">
                        <p className="fr-header__service-title">Egapro</p>
                      </a>
                    </NextLink>
                    <p className="fr-header__service-tagline">
                      Index de l’égalité professionnelle et représentation équilibrée femmes – hommes
                    </p>
                  </div>
                </div>
                {isAuthenticated && (
                  <div className="fr-header__tools">
                    <div className="fr-header__tools-links">
                      <ul className="fr-btns-group">
                        <li>
                          <FormButton type="button" variant="secondary" onClick={disconnectUser}>
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
          {isAuthenticated && (
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
                  <ul className="fr-btns-group">
                    <li>
                      <FormButton type="button" variant="secondary" onClick={disconnectUser}>
                        Se déconnecter
                      </FormButton>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </header>
        <main role="main" id="content" className={styles.content}>
          {children}
        </main>
        <Footer>
          <FooterBody>
            <FooterBodyBrand>
              <NextLink href="/">
                <a>
                  <Logo />
                </a>
              </NextLink>
            </FooterBodyBrand>
            <FooterBodyContent>
              <FooterBodyContentDescription>
                Index Egapro et Représentation équilibrée ont été développés par les équipes de la fabrique numérique
                des ministères sociaux
              </FooterBodyContentDescription>
              <FooterBodyContentItems>
                <FooterBodyItem>
                  <FooterContentLink
                    href=" https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx"
                    target="_blank"
                    rel="noreferrer"
                    title="Télécharger la liste des référents au format xlsx"
                  >
                    Télécharger la liste des référents
                  </FooterContentLink>
                </FooterBodyItem>
                <FooterBodyItem>
                  <FooterContentLink
                    href="https://github.com/SocialGouv/egapro/tree/v2.11.4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Contribuer sur Github
                  </FooterContentLink>
                </FooterBodyItem>
              </FooterBodyContentItems>
            </FooterBodyContent>
          </FooterBody>
          <FooterBottom>
            <FooterBottomItem>
              <NextLink href="/cgu" passHref>
                <FooterBottomLink>CGU</FooterBottomLink>
              </NextLink>
            </FooterBottomItem>
            <FooterBottomItem>
              <NextLink href="/mentions-legales" passHref>
                <FooterBottomLink>Mentions légales</FooterBottomLink>
              </NextLink>
            </FooterBottomItem>
            <FooterBottomItem>
              <NextLink href="/politique-de-confidentialite" passHref>
                <FooterBottomLink>Politique de confidentialité</FooterBottomLink>
              </NextLink>
            </FooterBottomItem>
          </FooterBottom>
        </Footer>
      </div>
    </>
  );
};
