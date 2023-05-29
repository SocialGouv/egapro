import { consentModalNativeButtonProps } from "@codegouvfr/react-dsfr/ConsentBanner";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import DsfrFooter, { type FooterProps as DsfrFooterProps } from "@codegouvfr/react-dsfr/Footer";
import { config } from "@common/config";
import { Brand } from "@components/Brand";

export interface FooterProps extends Pick<DsfrFooterProps, "homeLinkProps"> {
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

export const Footer = ({ homeLinkProps, type }: FooterProps) => (
  <DsfrFooter
    brandTop={<Brand />}
    accessibility="partially compliant"
    accessibilityLinkProps={{
      href: "https://ara.numerique.gouv.fr/rapports/_YKXqg3aJMpFGmPh1tA0d/resultats",
      target: "_blank",
    }}
    contentDescription={`Index Egapro et Représentation équilibrée sont développés et maintenus par les équipes de la fabrique numérique des ministères sociaux.`}
    homeLinkProps={homeLinkProps}
    bottomItems={[
      {
        text: "CGU",
        linkProps: { href: "/cgu" },
      },
      {
        text: "Politique de confidentialité",
        linkProps: { href: "/politique-de-confidentialite" },
      },
      {
        ...headerFooterDisplayItem,
        iconId: "fr-icon-theme-fill",
      },
    ]}
    personalDataLinkProps={{ href: "/politique-de-confidentialite" }}
    termsLinkProps={{ href: "/mentions-legales" }}
    cookiesManagementButtonProps={{
      nativeButtonProps: consentModalNativeButtonProps,
    }}
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
        links: [githubLink, type === "company" ? referenteDownloadLink : helpLink],
      },
      {
        categoryName: " ",
        links: [type === "company" ? helpLink : contactLink],
      },
    ]}
  />
);
