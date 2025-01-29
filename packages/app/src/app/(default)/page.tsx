import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Card from "@codegouvfr/react-dsfr/Card";
import { Box, Container, Grid, GridCol, Heading, ImgHome } from "@design-system";

import styles from "./index.module.css";

export const dynamic = "force-static";

const Home = async () => {
  return (
    <>
      <Box pt="9w" pb="4w" className={styles.hero}>
        <Container>
          <Grid haveGutters>
            <GridCol lg={7}>
              <Heading as="h1" text="Bienvenue sur Egapro" />
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
            <Card
              horizontal
              title="Index de l'égalité professionnelle femmes‑hommes"
              desc="Calculer et/ou déclarer votre index de l'égalité professionnelle entre les femmes et les hommes."
              linkProps={{
                href: "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro",
                target: "_blank",
                rel: "noreferrer",
                title: "Pour plus d'informations sur l'index Egapro",
              }}
              footer={
                <ButtonsGroup
                  isReverseOrder
                  inlineLayoutWhen="lg and up"
                  buttons={[
                    {
                      children: "Calculer - Déclarer mon Index",
                      linkProps: {
                        href: "/index-egapro",
                      },
                    },
                    {
                      children: "Consulter l'Index",
                      linkProps: {
                        href: "/index-egapro/recherche",
                        target: "_blank",
                      },
                      priority: "tertiary no outline",
                    },
                  ]}
                />
              }
            />
          </GridCol>
          <GridCol md={6}>
            <Card
              horizontal
              title="Représentation équilibrée femmes‑hommes"
              desc="Déclarer vos écarts de représentation entre les femmes et les hommes dans les postes de direction."
              linkProps={{
                href: "https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/representation-equilibree-f-h-dans-les-postes-de-direction-des-grandes/",
                target: "_blank",
                rel: "noreferrer",
                title: "Pour plus d'informations sur la représentation équilibrée",
              }}
              footer={
                <ButtonsGroup
                  isReverseOrder
                  inlineLayoutWhen="lg and up"
                  buttons={[
                    {
                      children: "Déclarer mes Écarts",
                      linkProps: {
                        href: "/representation-equilibree",
                      },
                    },
                    {
                      children: "Consulter les Écarts",
                      linkProps: {
                        href: "/representation-equilibree/recherche",
                        target: "_blank",
                      },
                      priority: "tertiary no outline",
                    },
                  ]}
                />
              }
            />
          </GridCol>
        </Grid>
      </Container>
    </>
  );
};

export default Home;
