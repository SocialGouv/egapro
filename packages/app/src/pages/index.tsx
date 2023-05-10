import { config } from "@common/config";
import { BasicLayoutPublic } from "@components/layouts/BasicLayoutPublic";
import {
  Box,
  ButtonAsLink,
  Card,
  CardBody,
  CardBodyContent,
  CardBodyContentDescription,
  CardBodyContentTitle,
  CardBodyFooter,
  Container,
  Grid,
  GridCol,
  ImgHome,
} from "@design-system";
import { type GetStaticProps } from "next";

import { NextLinkOrA } from "../design-system/utils/NextLinkOrA";
import { type NextPageWithLayout } from "./_app";
import styles from "./index.module.css";

interface HomeProps {
  /** Feature flags */
  ff: typeof config.ff;
}

const Home: NextPageWithLayout<HomeProps> = ({ ff }) => {
  return (
    <section>
      <Box pt="9w" pb="4w" className={styles.hero}>
        <Container>
          <Grid haveGutters>
            <GridCol lg={7}>
              <h1>Bienvenue sur Egapro</h1>
              <p>
                Toutes les entreprises d’au moins 50 salariés doivent calculer et publier leur Index de l’égalité
                professionnelle entre les femmes et les hommes, chaque année au plus tard le 1er mars.
              </p>
              <p>
                Les entreprises qui emploient au moins 1 000 salariés pour le troisième exercice consécutif doivent
                également calculer et publier leurs écarts éventuels de représentation entre les femmes et les hommes
                parmi leurs cadres dirigeants et les membres de leurs instances dirigeantes, chaque année au plus tard
                le 1er mars.
              </p>
            </GridCol>
            <GridCol md={6} lg={5} className="fr-mx-auto">
              <ImgHome />
            </GridCol>
          </Grid>
        </Container>
      </Box>
      <Container mt="8w">
        <Grid haveGutters mb="8w">
          <GridCol md={6}>
            <Card>
              <CardBody>
                <CardBodyContent>
                  <CardBodyContentTitle titleAs="h2">
                    Index de l'égalité professionnelle femmes-hommes
                  </CardBodyContentTitle>
                  <CardBodyContentDescription>
                    Calculer et/ou déclarer votre index de l'égalité professionnelle entre les femmes et les hommes.
                  </CardBodyContentDescription>
                  <CardBodyContentDescription>
                    <a
                      href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Pour plus d'informations sur l'index Egapro
                    </a>
                  </CardBodyContentDescription>
                </CardBodyContent>
                <CardBodyFooter>
                  <ButtonAsLink href="/index-egapro" className="fr-mr-4w">
                    Calculer - Déclarer mon Index
                  </ButtonAsLink>
                  <NextLinkOrA href="/index-egapro/recherche">Rechercher l'Index</NextLinkOrA>
                </CardBodyFooter>
              </CardBody>
            </Card>
          </GridCol>
          <GridCol md={6}>
            <Card>
              <CardBody>
                <CardBodyContent>
                  <CardBodyContentTitle titleAs="h2">Représentation équilibrée femmes-hommes</CardBodyContentTitle>
                  <CardBodyContentDescription>
                    Déclarer vos écarts de représentation entre les femmes et les hommes dans les postes de direction.
                  </CardBodyContentDescription>
                  <CardBodyContentDescription>
                    <NextLinkOrA
                      href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes/"
                      target="_blank"
                      rel="noreferrer"
                      isExternal
                    >
                      Pour plus d'informations sur la représentation équilibrée
                    </NextLinkOrA>
                  </CardBodyContentDescription>
                </CardBodyContent>
                <CardBodyFooter>
                  <ButtonAsLink href="/representation-equilibree" className="fr-mr-4w">
                    Déclarer mes Écarts
                  </ButtonAsLink>
                  <NextLinkOrA href="/representation-equilibree/recherche">Consulter les Écarts</NextLinkOrA>
                </CardBodyFooter>
              </CardBody>
            </Card>
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = _ctx => {
  return {
    props: { ff: config.ff },
  };
};

Home.getLayout = ({ children }) => {
  return <BasicLayoutPublic>{children}</BasicLayoutPublic>;
};

export default Home;
