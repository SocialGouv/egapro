/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { config } from "@common/config";
import { type SearchConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import {
  type GetDeclarationStatsInput,
  getDeclarationStatsInputSchema,
} from "@common/core-domain/dtos/SearchDeclarationDTO";
import { type NextServerPageProps, withSearchParamsValidation } from "@common/utils/next";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { Box, Container, DetailedDownload, Grid, GridCol, Heading, Stat, Text } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { SimpleSubmitForm } from "@design-system/utils/client/SimpleSubmitForm";
import { getStats } from "@services/server/getDeclarationStats";
import { Suspense } from "react";

import { SearchSirenForm } from "../../SearchSirenForm";
import { AverageIndicatorForm } from "./AverageIndicatorForm";
import { DisplayIndexResults } from "./DisplayIndexResults";

export const dynamic = "force-dynamic";

const description = "Page de recherche de l'index d'égalité professionnelle";

export const metadata = {
  title: "Index Egapro",
  description,
  openGraph: {
    title: "Index d'égalité professionnelle",
    description,
  },
};

const Recherche = withSearchParamsValidation(getDeclarationStatsInputSchema)(async ({
  searchParams,
  searchParamsError,
}: NextServerPageProps<"", typeof getDeclarationStatsInputSchema>) => {
  const { limit: _, page, year, ...partialSearchParams } = searchParams;

  // handle when "onchange" are triggered from stats section form
  const isLandingPage = typeof year !== "undefined" && typeof partialSearchParams.query === "undefined" && page === 0;
  return (
    <>
      <Container as="section" className={fr.cx("fr-pb-3w")}>
        <Grid haveGutters align="center">
          <GridCol sm={12} md={10} xl={8}>
            {searchParamsError && (
              <>
                <DebugButton obj={searchParamsError} infoText="searchParamsError" />
                <Alert
                  small
                  closable
                  severity="error"
                  description="Les paramètres d'url sont malformés."
                  className={fr.cx("fr-mb-2w")}
                />
              </>
            )}
            <Heading as="h1" variant="h5" text="Rechercher l'index de l'égalité professionnelle d'une entreprise" />
            {isLandingPage ? (
              <SimpleSubmitForm noValidate>
                <SearchBar
                  big
                  label="Rechercher"
                  nativeInputProps={{
                    placeholder: "Nom ou numéro de SIREN de l'entreprise",
                    name: "query",
                  }}
                  className={fr.cx("fr-pb-2w")}
                />
              </SimpleSubmitForm>
            ) : (
              <SearchSirenForm searchParams={searchParams} />
            )}
            {/* @ts-ignore */}
            <DetailedDownload
              href={new URL("/index-egalite-fh.xlsx", config.host).toString()}
              label={date => `Télécharger le fichier des index des entreprises au ${date}`}
              className={fr.cx("fr-mb-0")}
            />
          </GridCol>
        </Grid>
      </Container>
      <Box style={{ backgroundColor: "var(--background-alt-grey)" }} className={fr.cx("fr-pb-6w", "fr-pt-4w")}>
        {!searchParamsError && (
          <Suspense>
            {isLandingPage ? (
              //@ts-ignore
              <StatsSection {...partialSearchParams} year={year} />
            ) : (
              //@ts-ignore
              <ResultsSection {...searchParams} />
            )}
          </Suspense>
        )}
      </Box>
    </>
  );
});

export default Recherche;

const StatsSection = async (statsInput: GetDeclarationStatsInput) => {
  const stats = await getStats(statsInput);
  const average = stats.avg?.toFixed(0);

  return (
    <Container as="section">
      <Grid haveGutters align="center">
        <GridCol>
          <DebugButton obj={stats} infoText="Stats" />
          {average ? (
            <Stat
              display={{ asTitle: "lg" }}
              text={average}
              label={`Index Moyen ${+statsInput.year}`}
              helpText={`Sur ${stats.count} déclaration${stats.count > 1 ? "s" : ""} (min: ${stats.min}, max: ${
                stats.max
              })`}
            />
          ) : (
            <Stat display={{ asTitle: "lg" }} text="N/A" helpText={`Index Moyen ${+statsInput.year}`} />
          )}
        </GridCol>
        <GridCol sm={12} md={10} lg={8}>
          <AverageIndicatorForm searchParams={statsInput} />
        </GridCol>
      </Grid>
    </Container>
  );
};

const ResultsSection = async (searchParams: SearchConsultationDTO) => {
  return (
    <Container as="section">
      <Grid haveGutters align="center">
        <GridCol sm={12} md={10} xl={8}>
          <ClientAnimate>
            <Alert
              severity="warning"
              closable
              description="Les informations de l'entreprise ou de l'UES correspondent à la dernière déclaration."
              small
              className="fr-mb-3w"
            />
            <Suspense fallback={<Text variant="lg" text="Chargement des résultats..." />}>
              {/* @ts-ignore */}
              <DisplayIndexResults {...searchParams} />
            </Suspense>
          </ClientAnimate>
        </GridCol>
      </Grid>
    </Container>
  );
};
