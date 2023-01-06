import "@gouvfr/dsfr/dist/dsfr.main.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.min.css";

import { AuthenticatedOnly } from "@components/AuthenticatedOnly";
import { ClientOnly } from "@components/ClientOnly";
import {
  Box,
  Card,
  CardBody,
  CardBodyContent,
  CardBodyContentDescription,
  CardBodyContentTitle,
  CardHeader,
  CardHeaderImg,
  Container,
  Grid,
  GridCol,
  ImgHome,
  Stepper,
  StepperDetails,
  StepperTitle,
} from "@design-system";
import Head from "next/head";
import { useRouter } from "next/router";
import type { PropsWithChildren } from "react";

import { App } from "./App";
import styles from "./RepresentationEquilibreeLayout.module.css";

const STEPS = [
  "/commencer",
  "/declarant",
  "/entreprise",
  "/periode-reference",
  "/ecarts-cadres",
  "/ecarts-membres",
  "/publication",
  "/validation",
];

const STEPS_TITLE = [
  "Commencer",
  "Informations déclarant",
  "Informations entreprise",
  "Période de Référence",
  "Écarts de représentation - Cadres dirigeants",
  "Écarts de représentation - Membres des instances dirigeantes",
  "Publication",
  "Validation de vos écarts",
];

const DEFAULT_TITLE = "Représentation équilibrée Egapro";

/**
 * Layout for authenticated users in représentation équilibrée.
 */
export const RepresentationEquilibreeLayout = ({
  title,
  children,
  haveBottomSection,
  disableAuth,
}: PropsWithChildren<{ disableAuth?: boolean; haveBottomSection?: boolean; title?: string | undefined }>) => {
  const { pathname } = useRouter();

  const foundStep = STEPS.findIndex(stepName => pathname.endsWith(stepName));
  const currentStep = foundStep > -1 ? foundStep : null;

  return (
    <App>
      <Head>
        <title>{title ? title + " - " + DEFAULT_TITLE : DEFAULT_TITLE}</title>
      </Head>
      <Container py="6w">
        <Grid justifyCenter>
          <GridCol md={10} lg={8}>
            <ClientOnly>
              <AuthenticatedOnly disableAuth={disableAuth}>
                {currentStep !== null && (
                  <Stepper mb="6w">
                    <StepperTitle currentStep={currentStep + 1} numberOfSteps={STEPS.length}>
                      {STEPS_TITLE[currentStep]}
                    </StepperTitle>
                    {STEPS_TITLE[currentStep + 1] && <StepperDetails>{STEPS_TITLE[currentStep + 1]}</StepperDetails>}
                  </Stepper>
                )}
                {children}
              </AuthenticatedOnly>
            </ClientOnly>
          </GridCol>
        </Grid>
      </Container>
      {haveBottomSection && (
        <Box py="9w" className={styles.gradient}>
          <Container>
            <Grid justifyCenter>
              <GridCol lg={8}>
                <Card size="sm" isEnlargeLink noBorder isHorizontal>
                  <CardBody>
                    <CardBodyContent>
                      <CardBodyContentTitle>
                        <a href="https://egapro.travail.gouv.fr">
                          Avez-vous déclaré l’index égalité professionnelle F/H&nbsp;?
                        </a>
                      </CardBodyContentTitle>
                      <CardBodyContentDescription>
                        Toutes les entreprises d’au moins 50 salariés doivent calculer et publier leur Index de
                        l’égalité professionnelle entre les femmes et les hommes, chaque année au plus tard le 1er mars.
                      </CardBodyContentDescription>
                    </CardBodyContent>
                  </CardBody>
                  <CardHeader>
                    <CardHeaderImg>
                      <ImgHome />
                    </CardHeaderImg>
                  </CardHeader>
                </Card>
              </GridCol>
            </Grid>
          </Container>
        </Box>
      )}
    </App>
  );
};
