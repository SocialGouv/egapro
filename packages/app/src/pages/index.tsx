import Image from "next/image";
import NextLink from "next/link";

import picture from "../../public/picture-1.svg";
import type { NextPageWithLayout } from "./_app";
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
} from "@design-system";

const Home: NextPageWithLayout = () => {
  return (
    <section>
      <Box pt="9w" pb="4w" style={{ background: "#f6f6f6" }}>
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
              <Image src={picture} alt="" layout="responsive" />
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
                    <a href="#">Pour plus d'informations sur l'index Egapro</a>
                  </CardBodyContentDescription>
                </CardBodyContent>
                <CardBodyFooter>
                  <NextLink href="/index" passHref>
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
                  <CardBodyContentTitle titleAs="h2">Répartition équilibrée femmes-hommes</CardBodyContentTitle>
                  <CardBodyContentDescription>
                    Déclarer vos écarts de représentation entre les femmes et les hommes dans les postes de direction.
                  </CardBodyContentDescription>
                  <CardBodyContentDescription>
                    <a href="#">Pour plus d'informations sur la répartition équilibrée</a>
                  </CardBodyContentDescription>
                </CardBodyContent>
                <CardBodyFooter>
                  <NextLink href="/ecart-rep" passHref>
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
