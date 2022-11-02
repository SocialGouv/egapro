import NextLink from "next/link";

import type { NextPageWithLayout } from "./_app";
import styles from "./index.module.css";
import { BasicLayout } from "@components/layouts/BasicLayout";
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

const Home: NextPageWithLayout = () => {
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
                  <NextLink href="/index-egapro" passHref>
                    <ButtonAsLink>Calculer - Déclarer mon Index</ButtonAsLink>
                  </NextLink>
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
                    <a
                      href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Pour plus d'informations sur la représentation équilibrée
                    </a>
                  </CardBodyContentDescription>
                </CardBodyContent>
                <CardBodyFooter>
                  <NextLink href="/representation-equilibree" passHref>
                    <ButtonAsLink>Déclarer mes Écarts</ButtonAsLink>
                  </NextLink>
                </CardBodyFooter>
              </CardBody>
            </Card>
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

Home.getLayout = ({ children }) => {
  return <BasicLayout>{children}</BasicLayout>;
};

export default Home;
