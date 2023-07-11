import { fr } from "@codegouvfr/react-dsfr";
import { Container, Grid, GridCol } from "@design-system";

import { BarChart } from "./components/client/BarChart";
import { DoughnutChart } from "./components/client/DoughnutChart";
import { DataCard } from "./components/DataCard";
import { StatCard } from "./components/StatCard";

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

const Stats = () => {
  return (
    <Container py="8w">
      <Grid align="center">
        <GridCol>
          <h1>{title}</h1>
          <h2 className={fr.cx("fr-mt-8w", "fr-mb-1w")}>Index Egapro</h2>
          <p>Index Egapro dans les entreprises et UES de plus de 50 salariés.</p>
          <Grid haveGutters className={fr.cx("fr-mt-4w")}>
            <GridCol md={12} lg={4}>
              <DataCard
                title="Index moyen"
                data={
                  <>
                    86&nbsp;<small>/&nbsp;100</small>
                  </>
                }
              />
            </GridCol>
            <GridCol sm={12} md={6} lg={4}>
              <StatCard title="Index moyen par tranche d'effectifs assujettis">
                <BarChart
                  theme="multicolor"
                  showValue={true}
                  data={[
                    {
                      legend: "1000 et plus",
                      value: 87,
                    },
                    {
                      legend: "251 à 999",
                      value: 84,
                    },
                    {
                      legend: "50 à 250",
                      value: 50,
                    },
                  ]}
                  tooltipLegend="Index moyen"
                />
              </StatCard>
            </GridCol>
            <GridCol sm={12} md={6} lg={4}>
              <StatCard title="Index moyen par année">
                <BarChart
                  showValue={true}
                  data={[
                    {
                      legend: "2022",
                      value: 86,
                    },
                    {
                      legend: "2021",
                      value: 85,
                    },
                    {
                      legend: "2020",
                      value: 84,
                    },
                  ]}
                  tooltipLegend="Index"
                />
              </StatCard>
            </GridCol>
          </Grid>
          <Grid haveGutters className={fr.cx("fr-mt-4w")}>
            <GridCol md={12} lg={4}>
              <DataCard title="Répondants" data="2670" />
            </GridCol>
            <GridCol sm={12} md={6} lg={4}>
              <StatCard title="Répondants par tranche d'effectifs assujettis">
                <BarChart
                  theme="multicolor"
                  data={[
                    {
                      legend: "1000 et plus",
                      value: 1274,
                    },
                    {
                      legend: "251 à 999",
                      value: 4900,
                    },
                    {
                      legend: "50 à 250",
                      value: 20275,
                    },
                  ]}
                  tooltipLegend="Nombre de répondants"
                />
              </StatCard>
            </GridCol>
          </Grid>

          <h2 className={fr.cx("fr-mt-8w", "fr-mb-1w")}>Représentation équilibrée</h2>
          <p>Entreprises de plus de 1000 salariés pendant 3 exercices consécutifs.</p>

          <Grid haveGutters className="fr-mt-2w">
            <GridCol md={12} lg={4}>
              <DataCard title="Répondants" data="2670" />
            </GridCol>
            <GridCol sm={12} md={6} lg={4}>
              <StatCard title="Répartition des femmes dans les instances dirigeantes">
                <DoughnutChart
                  data={[
                    {
                      legend: "Plus de 30% de femmes",
                      value: 14,
                    },
                    {
                      legend: "Moins de 30% de femmes",
                      value: 10,
                    },
                    {
                      legend: "Non calculable",
                      value: 10,
                    },
                  ]}
                  tooltipLegend="Nombre de femmes"
                />
              </StatCard>
            </GridCol>
            <GridCol sm={12} md={6} lg={4}>
              <StatCard title="Répartition des femmes parmi les cadres dirigeants">
                <DoughnutChart
                  data={[
                    {
                      legend: "Plus de 30% de femmes",
                      value: 14,
                    },
                    {
                      legend: "Moins de 30% de femmes",
                      value: 10,
                    },
                    {
                      legend: "Non calculable",
                      value: 10,
                    },
                  ]}
                  tooltipLegend="Nombre de femmes"
                />
              </StatCard>
            </GridCol>
          </Grid>
        </GridCol>
      </Grid>
    </Container>
  );
};

export default Stats;
