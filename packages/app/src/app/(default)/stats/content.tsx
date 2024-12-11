import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { CURRENT_YEAR } from "@common/dict";
import { CenteredContainer, Grid, GridCol } from "@design-system";

import { getPublicStats } from "./actions";
import { BarChart } from "./components/client/BarChart";
import { DoughnutChart } from "./components/client/DoughnutChart";
import { DataCard } from "./components/DataCard";
import { StatCard } from "./components/StatCard";

export const StatsContent = async () => {
  const stats = await getPublicStats();

  if (stats.index.count === 0 || stats.balancedRepresentation.count === 0) {
    return (
      <CenteredContainer>
        <Alert
          severity="info"
          title="Aucune donnée disponible"
          description="Il n'y a actuellement aucune donnée d'enregistrée."
        />
      </CenteredContainer>
    );
  }

  const lowestIndexAverageByWorkforceRange = Math.round(
    Object.entries(stats.index.averageByWorkforceRange).sort((a, b) => a[1] - b[1])[0][1],
  );
  // Round to the nearest multiple of 20
  const lowestIndexAverageByWorkforceRangeTwentieth = Math.round(lowestIndexAverageByWorkforceRange / 20) * 20;
  const indexAverageByWorkforceRangeYAxisMin = Math.max(lowestIndexAverageByWorkforceRangeTwentieth, 0);

  const lowestIndexLastThreeYearsAverage = Math.round(
    Object.entries(stats.index.lastThreeYearsAverage).sort((a, b) => a[1] - b[1])[0][1],
  );
  const lowestIndexLastThreeYearsAverageTwentieth = Math.round(lowestIndexLastThreeYearsAverage / 20) * 20;
  const indexLastThreeYearsAverageYAxisMin = Math.max(lowestIndexLastThreeYearsAverageTwentieth, 0);

  return (
    <>
      <h2 className={fr.cx("fr-mt-8w", "fr-mb-1w")}>
        Index Egapro {CURRENT_YEAR + 1} au titre des données {CURRENT_YEAR}
      </h2>
      <p>Entreprises et unités économiques et sociales (UES) d'au moins 50 salariés</p>
      <Grid haveGutters className={fr.cx("fr-mt-4w")}>
        <GridCol md={12} lg={4}>
          <DataCard title={`Déclarant${stats.index.count > 1 ? "s" : ""}`} data={stats.index.count} />
        </GridCol>
        <GridCol sm={12} md={6} lg={4}>
          <StatCard title="Déclarants par tranche d'effectifs assujettis">
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
              tooltipLegend="Nombre de déclarants"
            />
          </StatCard>
        </GridCol>
      </Grid>

      <Grid haveGutters className={fr.cx("fr-mt-4w")}>
        <GridCol md={12} lg={4}>
          <DataCard
            title="Index moyen"
            data={
              <>
                {Math.floor(stats.index.average)}&nbsp;<small>/&nbsp;100</small>
              </>
            }
          />
        </GridCol>
        <GridCol sm={12} md={6} lg={4}>
          <StatCard title="Index moyen par tranche d'effectifs assujettis">
            <BarChart
              theme="multicolor"
              showValue
              yAxisMin={indexAverageByWorkforceRangeYAxisMin}
              data={[
                {
                  legend: "1000 et plus",
                  value: Math.round(stats.index.averageByWorkforceRange["1000:"]),
                },
                {
                  legend: "251 à 999",
                  value: Math.round(stats.index.averageByWorkforceRange["251:999"]),
                },
                {
                  legend: "50 à 250",
                  value: Math.round(stats.index.averageByWorkforceRange["50:250"]),
                },
              ]}
              tooltipLegend="Index moyen"
            />
          </StatCard>
        </GridCol>
        <GridCol sm={12} md={6} lg={4}>
          <StatCard title="Index moyen par année de déclaration">
            <BarChart
              showValue
              data={Object.entries(stats.index.lastThreeYearsAverage)
                .map(entry => ({ legend: Number(entry[0]), value: Math.floor(Number(entry[1])) }))
                .sort((a, b) => b.legend - a.legend)}
              tooltipLegend="Index"
              yAxisMin={indexLastThreeYearsAverageYAxisMin}
            />
          </StatCard>
        </GridCol>
      </Grid>
      <h2 className={fr.cx("fr-mt-8w", "fr-mb-1w")}>
        Représentation équilibrée {CURRENT_YEAR + 1} au titre des données {CURRENT_YEAR}
      </h2>
      <p>Entreprises d'au moins 1000 salariés pour le troisième exercice consécutif.</p>
      <Grid haveGutters className="fr-mt-2w">
        <GridCol md={12} lg={4}>
          <DataCard
            title={`Déclarant${stats.balancedRepresentation.count > 1 ? "s" : ""}`}
            data={stats.balancedRepresentation.count}
          />
        </GridCol>
        <GridCol sm={12} md={6} lg={4}>
          <StatCard title="Répartition des femmes parmi les cadres dirigeants">
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
                  legend: "Ecart de représentation non calculable",
                  value: stats.balancedRepresentation.countWomen30percentExecutives.nc,
                },
              ]}
              tooltipLegend="Nombre de déclarants"
            />
          </StatCard>
        </GridCol>
        <GridCol sm={12} md={6} lg={4}>
          <StatCard title="Répartition des femmes parmi les membres des instances dirigeantes">
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
                  legend: "Ecart de représentation non calculable",
                  value: stats.balancedRepresentation.countWomen30percentMembers.nc,
                },
              ]}
              tooltipLegend="Nombre de déclarants"
            />
          </StatCard>
        </GridCol>
      </Grid>
    </>
  );
};
