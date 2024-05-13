import { Container, Grid, GridCol, Link } from "@design-system";

const title = "Déclaration d'accessibilité";
export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const AccessibilityStatement = () => {
  return (
    <section>
      <Container py="8w">
        <Grid align="center">
          <GridCol md={10} lg={8}>
            <h1>{title}</h1>
            <p>
              La Fabrique numérique des ministères sociaux s’engage à rendre son service accessible, conformément à
              l’article 47 de la loi n° 2005-102 du 11 février 2005.
            </p>
            <p>
              Cette déclaration d’accessibilité s’applique à Egapro (
              <Link href="https://egapro.travail.gouv.fr/" target="_blank" rel="noreferrer">
                https://egapro.travail.gouv.fr/
              </Link>
              )
            </p>
            <h2>Etat de conformité</h2>
            <p>Egapro est non conforme avec le RGAA. Le site n’a encore pas été audité.</p>
            <p>
              Un audit{" "}
              <Link
                href="https://ara.numerique.gouv.fr/rapport/WaoTZUAr00Y9Cec2PQbnb/resultats"
                target="_blank"
                rel="noreferrer"
              >
                Ara
              </Link>{" "}
              a été réalisé sur 25 critères.
            </p>
            <h2>Contenus non accessibles</h2>
            <h2>Amélioration et contact</h2>
            <p>
              Si vous n’arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le responsable de
              Egapro pour être orienté vers une alternative accessible ou obtenir le contenu sous une autre forme.
            </p>
            <p>
              E-mail : <Link href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</Link>
              <br />
              Nous essayons de répondre dans les 2 jours ouvrés.
            </p>
            <h2>Voie de recours</h2>
            <p>
              Cette procédure est à utiliser dans le cas suivant : vous avez signalé au responsable du site internet un
              défaut d’accessibilité qui vous empêche d’accéder à un contenu ou à un des services du portail et vous
              n’avez pas obtenu de réponse satisfaisante.
            </p>
            <p>Vous pouvez :</p>
            <p>
              Écrire un message au{" "}
              <Link href="https://formulaire.defenseurdesdroits.fr/" target="_blank" rel="noreferrer">
                Défenseur des droits
              </Link>
              <br />
              Contacter{" "}
              <Link href="https://www.defenseurdesdroits.fr/saisir/delegues" target="_blank" rel="noreferrer">
                le délégué du Défenseur des droits dans votre région
              </Link>
              <br />
              Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) :<br />
              Défenseur des droits
              <br />
              Libre réponse 71120 75342 Paris CEDEX 07
              <br />
              Cette déclaration d’accessibilité a été créé le 24 avril 2024 grâce au{" "}
              <Link
                href="https://betagouv.github.io/a11y-generateur-declaration/#create"
                target="_blank"
                rel="noreferrer"
              >
                Générateur de Déclaration d’Accessibilité de BetaGouv
              </Link>
              .
            </p>
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

export default AccessibilityStatement;
