import { Container, Grid, GridCol, Link } from "@design-system";

const title = "Mentions légales";
export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const LegalNotice = () => {
  return (
    <section>
      <Container py="8w">
        <Grid align="center">
          <GridCol md={10} lg={8}>
            <h1>{title}</h1>
            <h2>Éditeur de la plateforme</h2>
            <p>Le site est édité par la Direction générale du travail située&nbsp;:</p>
            <p>
              14 Avenue Duquesne
              <br />
              SP 07
              <br />
              75350&nbsp;Paris
            </p>
            <h2>Directeur de la publication</h2>
            <p>Pierre RAMAIN, directeur général du travail</p>
            <h2>Hébergement de la plateforme</h2>
            <p>La plateforme est hébergée par OVH, situé&nbsp;:</p>
            <p>
              2 rue Kellermann
              <br />
              59100 Roubaix
              <br />
              France
            </p>
            <h2>Accessibilité</h2>
            <p>
              La conformité aux normes d’accessibilité numérique est un objectif ultérieur mais nous tâchons de rendre
              ce site accessible à toutes et à tous.
            </p>
Si vous rencontrez un défaut d'accessibilité vous empêchant d'accéder à un contenu ou une fonctionnalité
du site, merci de nous en faire part via <Link href="mailto:contact@egapro.travail.gouv.fr">contact@egapro.travail.gouv.fr</Link>.
<br />
Si vous n'obtenez pas de réponse rapide de notre part, vous êtes en droit de faire parvenir vos doléances
ou une demande de saisine au Défenseur des droits.
            </p>
            <h3 className="fr-text--xl">En savoir plus</h3>
            <p>
              Pour en savoir plus sur la politique d’accessibilité numérique de l’État&nbsp;:{" "}
              <Link href="https://accessibilite.numerique.gouv.fr/" target="_blank" rel="noreferrer">
                https://accessibilite.numerique.gouv.fr/
              </Link>
            </p>
            <h2>Sécurité</h2>
            <p>
              La plateforme est protégée par un certificat électronique, matérialisé pour la grande majorité des
              navigateurs par un cadenas. Cette protection participe à la confidentialité des échanges.
            </p>
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

export default LegalNotice;
