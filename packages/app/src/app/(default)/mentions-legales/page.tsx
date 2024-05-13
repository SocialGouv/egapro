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
            <p>Egapro est édité par la Fabrique Numérique des Ministères sociaux située&nbsp;:</p>
            <p>
              Tour Mirabeau
              <br />
              39-43 Quai André Citroën
              <br />
              75015 PARIS
              <br />
              01 40 56 60 00
            </p>
            <h2>Directeur de la publication</h2>
            <p>Le directeur de la publication est Monsieur Pierre RAMAIN, directeur général du travail.</p>
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
              La plateforme est partiellement conforme aux normes d’accessibilité numérique, nous tâchons de la rendre
              accessible à toutes et à tous.
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
            <p>
              En aucun cas, les services associés à la plateforme ne seront à l’origine d’envoi de courriels pour
              demander la saisie d’informations personnelles.
            </p>
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

export default LegalNotice;
