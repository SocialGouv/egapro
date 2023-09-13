import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import DsfrFooter, { type FooterProps as DsfrFooterProps } from "@codegouvfr/react-dsfr/Footer";
import { config } from "@common/config";

import { FooterConsentManagementItem, FooterPersonalDataPolicyItem } from "./consentManagement";

export interface FooterProps {
  type: "company" | "public";
}

const githubLink = {
  text: "Contribuer sur Github",
  linkProps: {
    href: `https://github.com/SocialGouv/egapro/commit/${config.githubSha}`,
    target: "_blank",
    rel: "noreferrer",
  },
} satisfies DsfrFooterProps.LinkList.Link;

const helpLink = {
  text: "Consulter l'aide",
  linkProps: {
    href: "/aide-simulation",
  },
} satisfies DsfrFooterProps.LinkList.Link;

const contactLink = {
  text: "index@travail.gouv.fr",
  linkProps: {
    href: "mailto:index@travail.gouv.fr",
    target: "_blank",
    rel: "noreferrer",
  },
} satisfies DsfrFooterProps.LinkList.Link;

const referenteDownloadLink = {
  text: "Télécharger la liste des référents",
  linkProps: {
    title: "Télécharger la liste des référents au format xlsx",
    href: "https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx",
    target: "_blank",
    rel: "noreferrer",
  },
} satisfies DsfrFooterProps.LinkList.Link;

export const Footer = ({ type }: FooterProps) => (
  <DsfrFooter
    accessibility="partially compliant"
    accessibilityLinkProps={{
      href: "https://ara.numerique.gouv.fr/rapports/_YKXqg3aJMpFGmPh1tA0d/resultats",
      target: "_blank",
    }}
    contentDescription={`Index Egapro et Représentation équilibrée sont développés et maintenus par les équipes de la fabrique numérique des ministères sociaux.`}
    bottomItems={[
      {
        text: "CGU",
        linkProps: { href: "/cgu" },
      },
      <FooterPersonalDataPolicyItem key="FooterPersonalDataPolicyItem" />,
      {
        ...headerFooterDisplayItem,
        iconId: "fr-icon-theme-fill",
      },
      <FooterConsentManagementItem key="FooterConsentManagementItem" />,
    ]}
    termsLinkProps={{ href: "/mentions-legales" }}
    license={
      <>
        Sauf mention contraire, tous les contenus de ce site sont sous{" "}
        <a href="https://github.com/SocialGouv/egapro/blob/master/LICENSE" target="_blank" rel="noreferrer">
          licence Apache 2.0
        </a>
      </>
    }
    linkList={[
      {
        categoryName: "Liens utiles",
        links: [type === "company" ? referenteDownloadLink : helpLink, githubLink],
      },
      {
        categoryName: " ",
        links: [type === "company" ? helpLink : contactLink],
      },
    ]}
  />
);
