import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { PUBLIC_CURRENT_YEAR } from "@common/dict";
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
      {/* Descriptions détaillées pour l'accessibilité - masquées visuellement mais accessibles aux lecteurs d'écran */}
      <div id="chart-description-déclarants-par-tranche-d'effectifs-assujettis" className="sr-only">
        Ce graphique en barres horizontales présente la répartition des entreprises et unités économiques et sociales
        ayant déclaré leur index de l'égalité professionnelle selon leur tranche d'effectifs assujettis. Les données
        montrent : {stats.index.countByWorkforceRange["1000:"]} entreprises de 1000 salariés et plus,{" "}
        {stats.index.countByWorkforceRange["251:999"]} entreprises de 251 à 999 salariés, et{" "}
        {stats.index.countByWorkforceRange["50:250"]} entreprises de 50 à 250 salariés.
      </div>

      <div id="chart-description-index-moyen-par-tranche-d'effectifs-assujettis" className="sr-only">
        Ce graphique en barres horizontales présente l'index moyen de l'égalité professionnelle des entreprises et
        unités économiques et sociales selon leur tranche d'effectifs assujettis. Les résultats montrent :{" "}
        {Math.round(stats.index.averageByWorkforceRange["1000:"])} points sur 100 pour les entreprises de 1000 salariés
        et plus, {Math.round(stats.index.averageByWorkforceRange["251:999"])} points sur 100 pour celles de 251 à 999
        salariés, et {Math.round(stats.index.averageByWorkforceRange["50:250"])} points sur 100 pour celles de 50 à 250
        salariés.
      </div>

      <div id="chart-description-index-moyen-par-année-de-déclaration" className="sr-only">
        Ce graphique en barres horizontales présente l'évolution de l'index moyen de l'égalité professionnelle des
        entreprises et unités économiques et sociales sur les trois dernières années de déclaration.
        {Object.entries(stats.index.lastThreeYearsAverage)
          .map(entry => `Année ${Number(entry[0]) + 1} : ${Math.floor(Number(entry[1]))} points sur 100`)
          .join(", ")}
        .
      </div>

      <div id="chart-description-répartition-des-femmes-parmi-les-cadres-dirigeants" className="sr-only">
        Ce graphique en secteurs présente la répartition des entreprises selon le pourcentage de femmes parmi les cadres
        dirigeants. Sur {stats.balancedRepresentation.count} entreprises ayant déclaré leurs écarts de représentation :{" "}
        {stats.balancedRepresentation.countWomen30percentExecutives.gt} entreprises ont plus de 30% de femmes,{" "}
        {stats.balancedRepresentation.countWomen30percentExecutives.lte} entreprises ont moins de 30% de femmes, et{" "}
        {stats.balancedRepresentation.countWomen30percentExecutives.nc} entreprises ont un écart de représentation non
        calculable.
      </div>

      <div
        id="chart-description-répartition-des-femmes-parmi-les-membres-des-instances-dirigeantes"
        className="sr-only"
      >
        Ce graphique en secteurs présente la répartition des entreprises selon le pourcentage de femmes parmi les
        membres des instances dirigeantes. Sur {stats.balancedRepresentation.count} entreprises ayant déclaré leurs
        écarts de représentation : {stats.balancedRepresentation.countWomen30percentMembers.gt} entreprises ont plus de
        30% de femmes, {stats.balancedRepresentation.countWomen30percentMembers.lte} entreprises ont moins de 30% de
        femmes, et {stats.balancedRepresentation.countWomen30percentMembers.nc} entreprises ont un écart de
        représentation non calculable.
      </div>

      <h2 className={fr.cx("fr-mt-8w", "fr-mb-1w")}>
        Index Egapro {PUBLIC_CURRENT_YEAR + 1} au titre des données {PUBLIC_CURRENT_YEAR}
      </h2>
      <p>Entreprises et unités économiques et sociales (UES) d'au moins 50 salariés</p>
      <Grid haveGutters className={fr.cx("fr-mt-4w")}>
        <GridCol md={12} lg={4}>
          <DataCard title={`Déclarant${stats.index.count > 1 ? "s" : ""}`} data={stats.index.count} />
        </GridCol>
        <GridCol sm={12} md={6} lg={4}>
          <StatCard
            title="Déclarants par tranche d'effectifs assujettis"
            chartDescription={`Ce graphique en barres horizontales présente la répartition des ${stats.index.count} déclarants selon leur tranche d'effectifs assujettis. Les données montrent : ${stats.index.countByWorkforceRange["1000:"]} entreprises de 1000 salariés et plus, ${stats.index.countByWorkforceRange["251:999"]} entreprises de 251 à 999 salariés, et ${stats.index.countByWorkforceRange["50:250"]} entreprises de 50 à 250 salariés.`}
          >
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
              ariaLabel={`Graphique en barres : Répartition des déclarants par tranche d'effectifs. ${stats.index.countByWorkforceRange["1000:"]} entreprises de 1000+ salariés, ${stats.index.countByWorkforceRange["251:999"]} de 251-999 salariés, ${stats.index.countByWorkforceRange["50:250"]} de 50-250 salariés.`}
              ariaDescribedBy="chart-description-déclarants-par-tranche-d'effectifs-assujettis"
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
          <StatCard
            title="Index moyen par tranche d'effectifs assujettis"
            chartDescription={`Ce graphique en barres horizontales présente l'index moyen Egapro par tranche d'effectifs assujettis. Les résultats montrent : ${Math.round(
              stats.index.averageByWorkforceRange["1000:"],
            )} points pour les entreprises de 1000 salariés et plus, ${Math.round(
              stats.index.averageByWorkforceRange["251:999"],
            )} points pour celles de 251 à 999 salariés, et ${Math.round(
              stats.index.averageByWorkforceRange["50:250"],
            )} points pour celles de 50 à 250 salariés.`}
          >
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
              ariaLabel={`Graphique en barres : Index moyen par tranche d'effectifs. ${Math.round(
                stats.index.averageByWorkforceRange["1000:"],
              )} points pour 1000+ salariés, ${Math.round(
                stats.index.averageByWorkforceRange["251:999"],
              )} points pour 251-999 salariés, ${Math.round(
                stats.index.averageByWorkforceRange["50:250"],
              )} points pour 50-250 salariés.`}
              ariaDescribedBy="chart-description-index-moyen-par-tranche-d'effectifs-assujettis"
            />
          </StatCard>
        </GridCol>
        <GridCol sm={12} md={6} lg={4}>
          <StatCard
            title="Index moyen par année de déclaration"
            chartDescription={`Ce graphique en barres horizontales présente l'évolution de l'index moyen Egapro sur les trois dernières années de déclaration. ${Object.entries(
              stats.index.lastThreeYearsAverage,
            )
              .map(entry => `Année ${Number(entry[0]) + 1} : ${Math.floor(Number(entry[1]))} points`)
              .join(", ")}.`}
          >
            <BarChart
              showValue
              data={Object.entries(stats.index.lastThreeYearsAverage)
                .map(entry => ({ legend: Number(entry[0]) + 1, value: Math.floor(Number(entry[1])) }))
                .sort((a, b) => b.legend - a.legend)}
              tooltipLegend="Index"
              yAxisMin={indexLastThreeYearsAverageYAxisMin}
              ariaLabel={`Graphique en barres : Index moyen par année de déclaration. ${Object.entries(
                stats.index.lastThreeYearsAverage,
              )
                .map(entry => `${Number(entry[0]) + 1}: ${Math.floor(Number(entry[1]))} points`)
                .join(", ")}.`}
              ariaDescribedBy="chart-description-index-moyen-par-année-de-déclaration"
            />
          </StatCard>
        </GridCol>
      </Grid>
      <h2 className={fr.cx("fr-mt-8w", "fr-mb-1w")}>
        Représentation équilibrée {PUBLIC_CURRENT_YEAR + 1} au titre des données {PUBLIC_CURRENT_YEAR}
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
          <StatCard
            title="Répartition des femmes parmi les cadres dirigeants"
            chartDescription={`Ce graphique en secteurs présente la répartition des entreprises selon le pourcentage de femmes parmi les cadres dirigeants. Sur ${stats.balancedRepresentation.count} déclarants : ${stats.balancedRepresentation.countWomen30percentExecutives.gt} entreprises ont plus de 30% de femmes, ${stats.balancedRepresentation.countWomen30percentExecutives.lte} entreprises ont moins de 30% de femmes, et ${stats.balancedRepresentation.countWomen30percentExecutives.nc} entreprises ont un écart de représentation non calculable.`}
          >
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
              ariaLabel={`Graphique en secteurs : Répartition des femmes parmi les cadres dirigeants. ${stats.balancedRepresentation.countWomen30percentExecutives.gt} entreprises avec plus de 30% de femmes, ${stats.balancedRepresentation.countWomen30percentExecutives.lte} avec moins de 30%, ${stats.balancedRepresentation.countWomen30percentExecutives.nc} non calculable.`}
              ariaDescribedBy="chart-description-répartition-des-femmes-parmi-les-cadres-dirigeants"
            />
          </StatCard>
        </GridCol>
        <GridCol sm={12} md={6} lg={4}>
          <StatCard
            title="Répartition des femmes parmi les membres des instances dirigeantes"
            chartDescription={`Ce graphique en secteurs présente la répartition des entreprises selon le pourcentage de femmes parmi les membres des instances dirigeantes. Sur ${stats.balancedRepresentation.count} déclarants : ${stats.balancedRepresentation.countWomen30percentMembers.gt} entreprises ont plus de 30% de femmes, ${stats.balancedRepresentation.countWomen30percentMembers.lte} entreprises ont moins de 30% de femmes, et ${stats.balancedRepresentation.countWomen30percentMembers.nc} entreprises ont un écart de représentation non calculable.`}
          >
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
              ariaLabel={`Graphique en secteurs : Répartition des femmes parmi les membres des instances dirigeantes. ${stats.balancedRepresentation.countWomen30percentMembers.gt} entreprises avec plus de 30% de femmes, ${stats.balancedRepresentation.countWomen30percentMembers.lte} avec moins de 30%, ${stats.balancedRepresentation.countWomen30percentMembers.nc} non calculable.`}
              ariaDescribedBy="chart-description-répartition-des-femmes-parmi-les-membres-des-instances-dirigeantes"
            />
          </StatCard>
        </GridCol>
      </Grid>
    </>
  );
};
