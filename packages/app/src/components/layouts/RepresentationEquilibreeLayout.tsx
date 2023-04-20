import { AuthenticatedOnly } from "@components/AuthenticatedOnly";
import { ClientOnly } from "@components/ClientOnly";
import { Container, Grid, GridCol, Stepper, StepperDetails, StepperTitle } from "@design-system";
import Head from "next/head";
import { useRouter } from "next/router";
import type { PropsWithChildren } from "react";

import { App } from "./App";

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
  disableAuth,
}: PropsWithChildren<{ disableAuth?: boolean; title?: string | undefined }>) => {
  const { pathname } = useRouter();

  const foundStep = STEPS.findIndex(stepName => pathname.endsWith(stepName));
  const currentStep = foundStep > -1 ? foundStep : null;

  return (
    <App>
      <Head>
        <title>{title ? title + " - " + DEFAULT_TITLE : DEFAULT_TITLE}</title>
      </Head>

      <Container py="6w">
        <Grid align="center">
          <GridCol md={10} lg={8}>
            <ClientOnly>
              <AuthenticatedOnly disableAuth={disableAuth} redirectTo="/representation-equilibree/email">
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
    </App>
  );
};
