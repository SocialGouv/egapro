import { Display, headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { Header, type HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks";
import { config } from "@common/config";
import { Brand } from "@components/Brand";
import { Container } from "@design-system";
import { type PropsWithChildren } from "react";

import { Breadcrumb } from "./Breadcrumb";
import styles from "./consultation.module.css";
import { ConsultationFooter } from "./Footer";
import { Navigation } from "./Navigation";

const homeLinkProps: HeaderProps["homeLinkProps"] = {
  href: "/",
  title: "Accueil - Egapro - Ministère du Travail, de l’Emploi et de l’Insertion",
};

const brand = <Brand />;

const ConsultationLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <SkipLinks
        links={[
          {
            anchor: "#content",
            label: "Contenu",
          },
          {
            anchor: "#footer",
            label: "Pied de page",
          },
        ]}
      />
      <Header
        brandTop={brand}
        serviceTitle="Egapro"
        serviceTagline="Index de l’égalité professionnelle et représentation équilibrée femmes – hommes"
        homeLinkProps={homeLinkProps}
        navigation={<Navigation />}
      />
      <main role="main" id="content" className={styles.content}>
        <Container>
          <Breadcrumb />
        </Container>
        {children}
      </main>
      <ConsultationFooter
        brandTop={brand}
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
            links: [
              // {
              //   text: "Télécharger la liste des référents",
              //   linkProps: {
              //     href: `${config.apiv2_url}/public/referents_egalite_professionnelle.xlsx`,
              //     download: true,
              //     target: "_blank",
              //   },
              // },
              {
                text: "Contribuer sur Github",
                linkProps: {
                  href: `https://github.com/SocialGouv/egapro/commit/${config.githubSha}`,
                  target: "_blank",
                  rel: "noreferrer",
                },
              },
            ],
          },
          {
            categoryName: " ",
            links: [
              {
                text: "Consulter l'aide",
                linkProps: {
                  href: "/aide-simulation",
                },
              },
              {
                text: "index@travail.gouv.fr",
                linkProps: {
                  href: "mailto:index@travail.gouv.fr",
                  target: "_blank",
                  rel: "noreferrer",
                },
              },
            ],
          },
        ]}
      />
      <Display />
    </>
  );
};

export default ConsultationLayout;

export const metadata = {
  title: {
    template: "Recherche - %s",
    default: "Recherche",
  },
};
