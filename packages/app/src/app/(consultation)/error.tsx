"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { type NextErrorPageProps } from "@common/utils/next";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { Container, Grid, GridCol } from "@design-system";

const ConsultationError = ({ error }: NextErrorPageProps) => {
  return (
    <Container as="section" mb="8w">
      <Grid haveGutters align="center">
        <GridCol sm={12} md={10} lg={8}>
          <DebugButton obj={error} infoText="recherche-error" />
          <Alert title="Erreur" severity="error" description={error.message} />
        </GridCol>
      </Grid>
    </Container>
  );
};

export default ConsultationError;
