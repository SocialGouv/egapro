import { type PropsWithChildren } from "react";

import { Grid, GridCol } from "../base/Grid";
import { Container } from "./Container";

export const CenteredContainer = ({ children }: PropsWithChildren) => (
  <Container py="6w">
    <Grid align="center">
      <GridCol md={10} lg={8}>
        {children}
      </GridCol>
    </Grid>
  </Container>
);
