import { Container, Grid, GridCol } from "@design-system";
import { Suspense } from "react";

import { StatsContent } from "./content";

const title = "Statistiques";
const description =
  "Visualisez les écarts de rémunération entre les sexes et mettre en évidence leurs points de progression.";

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
};

const Stats = async () => {
  return (
    <Container py="8w">
      <Grid align="center">
        <GridCol>
          <h1>{title}</h1>
          <Suspense>
            <StatsContent />
          </Suspense>
        </GridCol>
      </Grid>
    </Container>
  );
};

export default Stats;
