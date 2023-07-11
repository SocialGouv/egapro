import { Grid, GridCol } from "../base/Grid";
import { Container, type ContainerProps } from "./Container";

export const CenteredContainer = ({ children, ...rest }: ContainerProps) => (
  <Container {...rest}>
    <Grid align="center">
      <GridCol md={10} lg={8}>
        {children}
      </GridCol>
    </Grid>
  </Container>
);
