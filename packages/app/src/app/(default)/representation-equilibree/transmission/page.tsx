import Card from "@codegouvfr/react-dsfr/Card";
import { Box, CenteredContainer, Container, Grid, GridCol, ImgJDMA, ImgSuccessLight, Link } from "@design-system";
import questionImg from "@public/img/question.svg";

import { SendReceipt } from "./SendReceipt";

const title = "Transmission";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Transmission = () => {
  return (
    <>
      <CenteredContainer>
        <Box style={{ textAlign: "center" }}>
          <ImgSuccessLight />
          <h1>Votre déclaration a été transmise</h1>
        </Box>
        <p>
          <strong>
            Vous avez transmis aux services du ministre chargé du travail vos écarts éventuels de représentation
            femmes-hommes conformément aux dispositions de{" "}
            <a
              href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045669617"
              target="_blank"
              rel="noreferrer"
            >
              l'article D. 1142-19 du code du travail
            </a>
            .
          </strong>
        </p>
        <p>
          Vous allez recevoir un accusé de réception de votre transmission sur l’email que vous avez déclaré et validé
          en début de procédure. Cet accusé de réception contient un lien vous permettant de revenir sur votre
          déclaration.
        </p>
        <p>
          Si vous ne recevez pas cet accusé, merci de bien vérifier que celui-ci n’a pas été déplacé dans votre dossier
          de courriers indésirables.
        </p>
        <p>Nous vous remercions de votre transmission.</p>
        <SendReceipt />
        <Box style={{ textAlign: "center" }} mt="6w">
          <Link
            href="https://jedonnemonavis.numerique.gouv.fr/Demarches/3494?&view-mode=formulaire-avis&nd_source=button&key=73366ddb13d498f4c77d01c2983bab48"
            target="_blank"
            rel="noreferrer"
            style={{ background: "none" }}
          >
            <ImgJDMA />
          </Link>
        </Box>
      </CenteredContainer>
      <Box style={{ backgroundColor: "var(--background-alt-grey)" }} py="4w">
        <Container as="section">
          <Grid align="center" haveGutters>
            <GridCol md={8}>
              <Card
                enlargeLink
                horizontal
                border={false}
                linkProps={{
                  href: "https://egapro.travail.gouv.fr/index-egapro/",
                }}
                title="Avez-vous déclaré l’index égalité professionnelle F/H ?"
                desc={
                  <>
                    Toutes les entreprises d’au moins 50 salariés doivent calculer et publier leur Index de l’égalité
                    professionnelle entre les femmes et les hommes, chaque année au plus tard le 1er mars.
                  </>
                }
                imageUrl={questionImg.src}
                imageAlt=""
              />
            </GridCol>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default Transmission;
