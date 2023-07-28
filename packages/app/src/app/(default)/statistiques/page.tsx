import { Container } from "@design-system";

import { StatsContent } from "./content";

export const dynamic = "force-dynamic";

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
      <h1>{title}</h1>
      <StatsContent />
    </Container>
  );
};

export default Stats;
