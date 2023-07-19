import { fr } from "@codegouvfr/react-dsfr";
import { type GetDeclarationStatsInput } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { Grid, GridCol } from "@design-system";

import { getPublicStats } from "./actions";
import { BarChart } from "./components/client/BarChart";
import { DoughnutChart } from "./components/client/DoughnutChart";
import { DataCard } from "./components/DataCard";
import { StatCard } from "./components/StatCard";

export const StatsContent = async (statsIndex: GetDeclarationStatsInput) => {
  const stats = await getPublicStats();

  return (
    <>
      <h2 className={fr.cx("fr-mt-8w", "fr-mb-1w")}>Index Egapro {statsIndex.year}</h2>
      <p>Index Egapro dans les entreprises et UES de plus de 50 salariés.</p>
      <Grid haveGutters className={fr.cx("fr-mt-4w")}>
        <GridCol md={12} lg={4}>
          <DataCard
            title="Index moyen"
            data={
              <>
                {stats.index.average}&nbsp;<small>/&nbsp;100</small>
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
                  value: stats.index.averageByWorkforceRange["1000:"],
                },
                {
                  legend: "251 à 999",
                  value: stats.index.averageByWorkforceRange["251:999"],
                },
                {
                  legend: "50 à 250",
                  value: stats.index.averageByWorkforceRange["50:250"],
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
              data={Object.entries(stats.index.lastThreeYearsAverage)
                .map(entry => {
                  return { legend: Number(entry[0]), value: Number(entry[1]) };
                })
                .sort(function (a, b) {
                  return b.legend - a.legend;
                })}
              tooltipLegend="Index"
            />
          </StatCard>
        </GridCol>
      </Grid>
      <Grid haveGutters className={fr.cx("fr-mt-4w")}>
        <GridCol md={12} lg={4}>
          <DataCard title={`Répondant${stats.index.count > 1 ? "s" : ""}`} data={stats.index.count} />
        </GridCol>
        <GridCol sm={12} md={6} lg={4}>
          <StatCard title="Répondants par tranche d'effectifs assujettis">
            <BarChart
              xAxisSuggestedMax={stats.index.count}
              theme="multicolor"
              data={[
                {
                  legend: "1000 et plus",
                  value: stats.index.countByWorkforceRange["1000:"],
                },
                {
                  legend: "251 à 999",
                  value: stats.index.countByWorkforceRange["251:999"],
                },
                {
                  legend: "50 à 250",
                  value: stats.index.countByWorkforceRange["50:250"],
                },
              ]}
              tooltipLegend="Nombre de répondants"
            />
          </StatCard>
        </GridCol>
      </Grid>

      <h2 className={fr.cx("fr-mt-8w", "fr-mb-1w")}>Représentation équilibrée {statsIndex.year}</h2>
      <p>Entreprises de plus de 1000 salariés pendant 3 exercices consécutifs.</p>

      <Grid haveGutters className="fr-mt-2w">
        <GridCol md={12} lg={4}>
          <DataCard
            title={`Répondant${stats.balancedRepresentation.count > 1 ? "s" : ""}`}
            data={stats.balancedRepresentation.count}
          />
        </GridCol>
        <GridCol sm={12} md={6} lg={4}>
          <StatCard title="Répartition des femmes dans les instances dirigeantes">
            <DoughnutChart
              data={[
                {
                  legend: "Plus de 30% de femmes",
                  value: stats.balancedRepresentation.countWomen30percentExecutives.gt,
                },
                {
                  legend: "Moins de 30% de femmes",
                  value: stats.balancedRepresentation.countWomen30percentExecutives.lte,
                },
                {
                  legend: "Non calculable",
                  value: stats.balancedRepresentation.countWomen30percentExecutives.nc,
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
                  value: stats.balancedRepresentation.countWomen30percentMembers.gt,
                },
                {
                  legend: "Moins de 30% de femmes",
                  value: stats.balancedRepresentation.countWomen30percentMembers.lte,
                },
                {
                  legend: "Non calculable",
                  value: stats.balancedRepresentation.countWomen30percentMembers.nc,
                },
              ]}
              tooltipLegend="Nombre de femmes"
            />
          </StatCard>
        </GridCol>
      </Grid>
    </>
  );
};
