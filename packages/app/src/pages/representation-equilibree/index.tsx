import { BasicLayout } from "@components/layouts/BasicLayout";
import {
  Box,
  ButtonAsLink,
  Callout,
  CalloutContent,
  Card,
  CardBody,
  CardBodyContent,
  CardBodyContentDescription,
  CardBodyContentTitle,
  CardBodyFooter,
  Container,
  Grid,
  GridCol,
  ImgRepresentationEquilibree,
} from "@design-system";
import Head from "next/head";
import NextLink from "next/link";

import type { NextPageWithLayout } from "../_app";

export const RepresentationEquilibree: NextPageWithLayout = () => (
  <>
    <Head>
      <meta
        name="description"
        content="La loi du 24 décembre 2021 visant à accélérer l’égalité économique et professionnelle a créé une obligation de représentation équilibrée entre les femmes et les hommes parmi les cadres dirigeants et les membres des instances dirigeantes des grandes entreprises, accompagnée d’une obligation de transparence en la matière."
      />
    </Head>
    <Box py="9w" as="section">
      <Container>
        <Grid>
          <GridCol lg={7}>
            <h1>
              <span className="fr-h3 fr-mb-0" style={{ display: "block" }}>
                Bienvenue sur
              </span>{" "}
              la déclaration des écarts de représentation F/H dans les postes de direction
            </h1>
            <p>
              <a
                href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000044559192"
                target="_blank"
                rel="noopener noreferrer"
              >
                La loi du 24 décembre 2021
              </a>{" "}
              visant à accélérer l’égalité économique et professionnelle a créé une obligation de représentation
              équilibrée entre les femmes et les hommes parmi les <strong>cadres dirigeants</strong> et les{" "}
              <strong>membres des instances dirigeantes</strong> des grandes entreprises, accompagnée d’une{" "}
              <strong>obligation de transparence</strong> en la matière.
            </p>
            <NextLink href="/representation-equilibree/assujetti/" passHref>
              <ButtonAsLink>Déclarer les écarts éventuels de représentation femmes-hommes</ButtonAsLink>
            </NextLink>
          </GridCol>
          <GridCol lg={5}>
            <ImgRepresentationEquilibree />
          </GridCol>
        </Grid>
        <Grid haveGutters mt="5w">
          <GridCol lg={6}>
            <Card>
              <CardBody>
                <CardBodyContent>
                  <CardBodyContentTitle titleAs="h2">Êtes-vous assujetti&nbsp;?</CardBodyContentTitle>
                  <CardBodyContentDescription>
                    Les entreprises qui emploient au moins 1 000 salariés pour le troisième exercice consécutif doivent
                    publier et déclarer chaque année au plus tard le 1er mars leurs écarts éventuels de représentation
                    entre les femmes et les hommes parmi, d’une part, leurs cadres dirigeants, et d’autre part, les
                    membres de leurs instances dirigeantes, en parallèle de la publication et de la déclaration de leur
                    Index de l’égalité professionnelle.
                  </CardBodyContentDescription>
                </CardBodyContent>
              </CardBody>
            </Card>
          </GridCol>
          <GridCol lg={6}>
            <Card>
              <CardBody>
                <CardBodyContent>
                  <CardBodyContentTitle titleAs="h2">Besoin d’aide&nbsp;?</CardBodyContentTitle>
                  <CardBodyContentDescription>
                    Pour avoir plus d'informations sur le calcul et la publication de vos écarts éventuels de
                    représentation femmes-hommes, vous pouvez consulter le site internet du Ministère du Travail.
                  </CardBodyContentDescription>
                </CardBodyContent>
                <CardBodyFooter>
                  <ButtonAsLink
                    variant="secondary"
                    href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes/"
                    target="_blank"
                  >
                    Consulter le site du Ministère du Travail
                  </ButtonAsLink>
                </CardBodyFooter>
              </CardBody>
            </Card>
          </GridCol>
        </Grid>
        <Box mt="9w">
          <Callout>
            <CalloutContent>
              <ul>
                <li className="fr-mb-4v">
                  <strong>À compter de 2023</strong>, les entreprises devront publier et déclarer leurs écarts éventuels
                  de représentation femmes-hommes pour les cadres dirigeants et les instances dirigeantes selon le même
                  calendrier que l’Index de l’égalité professionnelle, à savoir au plus tard le 1er mars.
                </li>
                <li className="fr-mb-4v">
                  <strong>À compter du 1er mars 2026</strong>, elles devront atteindre un objectif de 30% de femmes et
                  d’hommes cadres dirigeants et de 30% de femmes et d’hommes membres d’instances dirigeantes. Les
                  entreprises n’ayant pas atteint cet objectif devront définir des mesures adéquates et pertinentes de
                  correction par accord collectif ou, à défaut, par décision unilatérale après consultation du comité
                  social et économique.
                </li>
                <li>
                  <strong>À compter du 1er mars 2029</strong>, elles devront atteindre un objectif de 40% de femmes et
                  d’hommes cadres dirigeants et de 40% de femmes et d’hommes membres d’instances dirigeantes. Les
                  entreprises n’ayant pas atteint cet objectif disposeront d’un délai de deux ans pour se mettre en
                  conformité, sous peine de pénalité financière. Elles devront par ailleurs, au bout d’un an, publier
                  des objectifs de progression et les mesures de correction retenues.
                </li>
              </ul>
            </CalloutContent>
          </Callout>
        </Box>
      </Container>
    </Box>
  </>
);

RepresentationEquilibree.getLayout = ({ children }) => {
  return (
    <BasicLayout title="Déclaration des écarts de représentation F/H dans les postes de direction">
      {children}
    </BasicLayout>
  );
};

export default RepresentationEquilibree;
