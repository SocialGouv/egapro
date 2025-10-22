"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer";

import { FooterConsentManagementItem, FooterPersonalDataPolicyItem } from "./consentManagement";

export function AppFooter() {
  return (
    <DsfrFooter
      id="footer"
      brandTop={
        <>
          RÉPUBLIQUE
          <br />
          FRANÇAISE
        </>
      }
      accessibility="non compliant"
      contentDescription="Egapro permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression."
      termsLinkProps={{
        href: "/mentions-legales",
      }}
      accessibilityLinkProps={{
        href: "/accessibilite",
      }}
      bottomItems={[
        {
          text: "Statistiques",
          linkProps: {
            href: "/stats",
          },
        },
        <FooterPersonalDataPolicyItem key="personal-data" />,
        <FooterConsentManagementItem key="consent" />,
      ]}
      operatorLogo={{
        imgUrl: "/images/logo-ministere-travail.svg",
        alt: "Ministère du Travail, du Plein emploi et de l'Insertion",
        orientation: "horizontal",
      }}
      license={
        <>
          Sauf mention contraire, tous les contenus de ce site sont sous{" "}
          <a
            href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
            target="_blank"
            rel="noreferrer"
            className={fr.cx("fr-link")}
          >
            licence etalab-2.0
          </a>
        </>
      }
    />
  );
}

// Export nommé pour la compatibilité avec les imports existants
export const Footer = AppFooter;
