import { BasicLayoutPublic } from "@components/layouts/BasicLayoutPublic";
import { Container, Grid, GridCol } from "@design-system";

import type { NextPageWithLayout } from "./_app";

const LegalNotice: NextPageWithLayout = () => {
  return (
    <section>
      <Container py="8w">
        <Grid align="center">
          <GridCol md={10} lg={8}>
            <h1>Mentions légales</h1>
            <h2>Éditeur de la plateforme</h2>
            <p>Index Egapro est édité par la Fabrique Numérique des Ministères sociaux.</p>
            <ul>
              <li>Adresse&nbsp;: Tour Mirabeau, 39-43 Quai André Citroën 75015 PARIS</li>
              <li>Tél&nbsp;: 01 40 56 60 00</li>
            </ul>
            <h2>Directeur de la publication</h2>
            <p>Directeur Général du Travail.</p>
            <h2>Hébergement de la plateforme</h2>
            <p>
              Ce site est hébergé au&nbsp;:
              <br /> Ministère des Affaires sociales et de la Santé
              <br /> 14 avenue Duquesne 75530 PARIS
            </p>
            <h2>Accessibilité</h2>
            <p>
              La conformité aux normes d’accessibilité numérique est un objectif ultérieur mais nous tâchons de rendre
              ce site accessible à toutes et à tous.
            </p>
            <h3 className="fr-text--xl">Signaler un dysfonctionnement</h3>
            <p>
              Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un contenu ou une fonctionnalité
              du site, merci de nous en faire part. Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en
              droit de faire parvenir vos doléances ou une demande de saisine au Défenseur des droits.
            </p>
            <h3 className="fr-text--xl">En savoir plus</h3>
            <p>
              Pour en savoir plus sur la politique d’accessibilité numérique de l’État&nbsp;:{" "}
              <a
                href="http://references.modernisation.gouv.fr/accessibilite-numerique"
                target="_blank"
                rel="noreferrer"
              >
                http://references.modernisation.gouv.fr/accessibilite-numerique
              </a>
            </p>
            <h2>Sécurité</h2>
            <p>
              Le site est protégé par un certificat électronique, matérialisé pour la grande majorité des navigateurs
              par un cadenas. Cette protection participe à la confidentialité des échanges. En aucun cas les services
              associés à la plateforme ne seront à l’origine d’envoi d'emails pour demander la saisie d’informations
              personnelles.
            </p>
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

LegalNotice.getLayout = ({ children }) => {
  return <BasicLayoutPublic title="Mentions légales">{children}</BasicLayoutPublic>;
};

export default LegalNotice;
