import Button from "@codegouvfr/react-dsfr/Button";
import CallOut from "@codegouvfr/react-dsfr/CallOut";
import Card from "@codegouvfr/react-dsfr/Card";
import { ParagrapheList } from "@components/ParagrapheList";
import { Box, CenteredContainer, Container, Grid, GridCol, ImgRepresentationEquilibree, Link } from "@design-system";

const title = "Déclaration des écarts de représentation F/H dans les postes de direction";
const description =
  "La loi du 24 décembre 2021 visant à accélérer l’égalité économique et professionnelle a créé une obligation de représentation équilibrée entre les femmes et les hommes parmi les cadres dirigeants et les membres des instances dirigeantes des grandes entreprises, accompagnée d’une obligation de transparence en la matière.";

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
};
const RepresentationEquilibree = () => (
  <Box pb="9w" as="section">
    <Container>
      <Grid>
        <GridCol lg={7}>
          <h1>
            <span className="fr-h3 fr-mb-0 block">Bienvenue sur</span> la représentation équilibrée dans les postes de
            direction
          </h1>
          <p>
            <Link
              href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000044559192"
              target="_blank"
              rel="noopener noreferrer"
            >
              La loi du 24 décembre 2021
            </Link>{" "}
            visant à accélérer l’égalité économique et professionnelle a créé une obligation de représentation
            équilibrée entre les femmes et les hommes parmi les <strong>cadres dirigeants</strong> et les{" "}
            <strong>membres des instances dirigeantes</strong> des grandes entreprises, accompagnée d’une{" "}
            <strong>obligation de transparence</strong> en la matière.
          </p>
          <p>
            Toutes les <strong>entreprises qui emploient au moins 1000 salariés</strong> pour le troisième exercice
            consécutif doivent calculer et publier <strong>chaque année au plus tard le 1er mars</strong> leurs écarts
            éventuels de représentation entre les femmes et les hommes parmi leurs cadres dirigeants et les membres de
            leurs instances dirigeantes. Elles doivent également transmettre leurs résultats au comité social et
            économique et aux services du ministre chargé du travail.
          </p>
        </GridCol>
        <GridCol lg={5}>
          <ImgRepresentationEquilibree />
        </GridCol>
      </Grid>
      <CenteredContainer>
        <Grid haveGutters mt="5w">
          <GridCol>
            <Card
              title="Déclaration des écarts de représentation"
              desc="Vous pouvez transmettre aux services du ministre chargé du travail vos écarts éventuels de représentation F/H via le formulaire de déclaration suivant."
              footer={<Button linkProps={{ href: "/representation-equilibree/assujetti" }}>Déclarer mes écarts</Button>}
            />
          </GridCol>
        </Grid>
        <Grid haveGutters mt="5w">
          {/*<GridCol lg={6}>*/}
          {/*  <Card*/}
          {/*    title="Êtes-vous assujetti ?"*/}
          {/*    desc="Les entreprises qui emploient au moins 1 000 salariés pour le troisième exercice consécutif doivent*/}
          {/*          publier et déclarer chaque année au plus tard le 1er mars leurs écarts éventuels de représentation*/}
          {/*          entre les femmes et les hommes parmi, d’une part, leurs cadres dirigeants, et d’autre part, les*/}
          {/*          membres de leurs instances dirigeantes, en parallèle de la publication et de la déclaration de leur*/}
          {/*          Index de l’égalité professionnelle."*/}
          {/*  />*/}
          {/*</GridCol>*/}
          <GridCol>
            <Card
              title="Besoin d’aide ?"
              desc={
                <>
                  <p>
                    Pour consulter l'aide du service d'identification MonComptePro (comment s'identifier, comment
                    rattacher une nouvelle entreprise à son compte, comment contacter le support, etc.),{" "}
                    <Link href={"/aide-moncomptepro"} target="_blank">
                      cliquez ici
                    </Link>
                  </p>

                  <p>
                    Pour consulter la FAQ sur le site internet du ministère chargé du travail,{" "}
                    <Link
                      href={
                        "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes/"
                      }
                      target="_blank"
                    >
                      cliquez ici
                    </Link>
                  </p>
                  <p>
                    Pour contacter le référent égalité professionnelle au sein de votre DREETS,{" "}
                    <Link
                      href={"https://egapro.travail.gouv.fr/apiv2/public/referents_egalite_professionnelle.xlsx"}
                      target="_blank"
                    >
                      cliquez ici
                    </Link>
                  </p>
                </>
              }
            />
          </GridCol>
        </Grid>
      </CenteredContainer>
      <Box mt="9w">
        <CallOut>
          {/* callout content wrapper is "p" tag, so we cannot use "ul" tag inside */}
          <ParagrapheList
            items={[
              {
                className: "fr-mb-4v",
                content: (
                  <>
                    <strong>À compter de 2023</strong>, les entreprises devront publier et déclarer leurs écarts
                    éventuels de représentation femmes‑hommes pour les cadres dirigeants et les instances dirigeantes
                    selon le même calendrier que l’Index de l’égalité professionnelle, à savoir au plus tard le 1er
                    mars.
                  </>
                ),
              },
              {
                className: "fr-mb-4v",
                content: (
                  <>
                    <strong>À compter du 1er mars 2026</strong>, elles devront atteindre un objectif de 30% de femmes et
                    d’hommes cadres dirigeants et de 30% de femmes et d’hommes membres d’instances dirigeantes. Les
                    entreprises n’ayant pas atteint cet objectif devront définir des mesures adéquates et pertinentes de
                    correction par accord collectif ou, à défaut, par décision unilatérale après consultation du comité
                    social et économique.
                  </>
                ),
              },
              {
                content: (
                  <>
                    <strong>À compter du 1er mars 2029</strong>, elles devront atteindre un objectif de 40% de femmes et
                    d’hommes cadres dirigeants et de 40% de femmes et d’hommes membres d’instances dirigeantes. Les
                    entreprises n’ayant pas atteint cet objectif disposeront d’un délai de deux ans pour se mettre en
                    conformité, sous peine de pénalité financière. Elles devront par ailleurs, au bout d’un an, publier
                    des objectifs de progression et les mesures de correction retenues.
                  </>
                ),
              },
            ]}
          />
        </CallOut>
      </Box>
    </Container>
  </Box>
);

export default RepresentationEquilibree;
