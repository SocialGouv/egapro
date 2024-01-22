import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import DsfrFooter, { type FooterProps as DsfrFooterProps } from "@codegouvfr/react-dsfr/Footer";
import { config } from "@common/config";

import { FooterPersonalDataPolicyItem } from "./consentManagement";

const githubLink = {
  text: "Contribuer sur Github",
  linkProps: {
    href: `https://github.com/SocialGouv/egapro/commit/${config.githubSha}`,
    target: "_blank",
    rel: "noreferrer",
  },
} satisfies DsfrFooterProps.LinkList.Link;

const helpLink = {
  text: "Consulter l'aide pour le calcul de l'index",
  linkProps: {
    href: "/aide-simulation",
    target: "_blank",
  },
} satisfies DsfrFooterProps.LinkList.Link;

const helpMCP = {
  text: "Consulter l'aide MonComptePro",
  linkProps: {
    href: "/aide-moncomptepro",
    target: "_blank",
  },
} satisfies DsfrFooterProps.LinkList.Link;

const contactLink = {
  text: "Contact support technique : index@travail.gouv.fr",
  linkProps: {
    href: "mailto:index@travail.gouv.fr",
    target: "_blank",
    rel: "noreferrer",
  },
} satisfies DsfrFooterProps.LinkList.Link;

const referenteDownloadLink = {
  text: "Télécharger la liste des référents Egapro - Dreets",
  linkProps: {
    title: "Télécharger la liste des référents au format xlsx",
    href: "https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx",
    target: "_blank",
    rel: "noreferrer",
  },
} satisfies DsfrFooterProps.LinkList.Link;

const labourMinistryIndex = {
  text: "Consulter le site du Ministère du Travail - Index",
  linkProps: {
    href: "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro",
    target: "_blank",
    rel: "noreferrer",
  },
} satisfies DsfrFooterProps.LinkList.Link;

const labourMinistryRepeq = {
  text: "Consulter le site du Ministère du Travail - Représentation équilibrée",
  linkProps: {
    href: "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes/",
    target: "_blank",
    rel: "noreferrer",
  },
} satisfies DsfrFooterProps.LinkList.Link;

export const Footer = () => (
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
        links: [contactLink, referenteDownloadLink],
      },
      {
        categoryName: " ",
        links: [helpLink, helpMCP],
      },
      {
        categoryName: " ",
        links: [labourMinistryIndex, labourMinistryRepeq],
      },
      {
        categoryName: " ",
        links: [githubLink],
      },
    ]}
  />
);
