import { consentModalButtonProps } from "@codegouvfr/react-dsfr/ConsentBanner";
import Display, { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import Footer from "@codegouvfr/react-dsfr/Footer";
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks";
import { config } from "@common/config";
import { Brand } from "@components/Brand";
import { Container, Grid, GridCol } from "@design-system";
import { type PropsWithChildren } from "react";

import styles from "./default.module.css";
import { Header, type HeaderProps } from "./Header";

export const metadata = {
  title: {
    template: "%s - Egapro",
    default: "Egapro",
  },
  openGraph: {
    title: { template: "%s - Egapro", default: "Egapro" },
  },
};

const homeLinkProps: HeaderProps["homeLinkProps"] = {
  href: "/",
  title: "Accueil - Egapro - Ministère du Travail, de l’Emploi et de l’Insertion",
};

const brand = <Brand />;

const ConsultationLayout = async ({ children }: PropsWithChildren) => {
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
      <Header homeLinkProps={homeLinkProps} />
      <main role="main" id="content" className={styles.content}>
        <Container py="6w">
          <Grid align="center">
            <GridCol md={10} lg={8}>
              {children}
            </GridCol>
          </Grid>
        </Container>
      </main>
      <Footer
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
        cookiesManagementButtonProps={consentModalButtonProps}
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
              {
                text: "Contribuer sur Github",
                linkProps: {
                  href: `https://github.com/SocialGouv/egapro/commit/${config.githubSha}`,
                  target: "_blank",
                  rel: "noreferrer",
                },
              },
              {
                text: "Télécharger la liste des référents",
                linkProps: {
                  title: "Télécharger la liste des référents au format xlsx",
                  href: "https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx",
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
