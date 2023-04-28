/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { config } from "@common/config";
import { type ConsultationDTO, type SearchConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import {
  type GetDeclarationStatsInput,
  getDeclarationStatsInputSchema,
  type SearchDeclarationResultDTO,
} from "@common/core-domain/dtos/SearchDeclarationDTO";
import { type NextServerPageProps, withSearchParamsValidation } from "@common/utils/next";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { Box, Container, Grid, GridCol, Heading, Stat, Text } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { NextPageLink } from "@design-system/utils/client/NextPageLink";
import { ScrollTopButton } from "@design-system/utils/client/ScrollTopButton";
import { SimpleSubmitForm } from "@design-system/utils/client/SimpleSubmitForm";
import { getStats } from "@services/server/getDeclarationStats";
import { search } from "@services/server/searchDeclaration";
import { isEmpty, times } from "lodash";
import { TileCompanyIndex } from "packages/app/src/design-system/base/client/TileCompanyIndex";
import { DetailedDownload } from "packages/app/src/design-system/base/DetailedDownload";
import { Suspense } from "react";

import { AverageIndicatorForm } from "./AverageIndicatorForm";

export const dynamic = "force-dynamic";

const Recherche = withSearchParamsValidation(getDeclarationStatsInputSchema)((async ({
  searchParams: { limit, page, year, ...partialSearchParams },
  searchParamsError,
}: NextServerPageProps<"", typeof getDeclarationStatsInputSchema>) => {
  const searchParams = { limit, page, ...partialSearchParams };

  const isLandingPage = isEmpty(partialSearchParams) && page === 0;
  return (
    <>
      <Container as="section">
        <Grid haveGutters align="center">
          <GridCol sm={12} md={10} lg={8}>
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
            <SimpleSubmitForm noValidate>
              <SearchBar
                big
                label="Rechercher"
                nativeInputProps={{
                  placeholder: "Nom ou numéro de SIREN de l'entreprise",
                  name: "query",
                }}
              />
            </SimpleSubmitForm>
            {/* @ts-ignore */}
            <DetailedDownload
              href={new URL("/index-egalite-fh.xlsx", config.host).toString()}
              label={date => `Télécharger le fichier des index des entreprises au ${date}`}
            />
          </GridCol>
        </Grid>
      </Container>
      <Box style={{ backgroundColor: "var(--background-alt-grey)" }} className={fr.cx("fr-pb-4w")}>
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
}) as any);

export default Recherche;

const StatsSection = async (statsInput: GetDeclarationStatsInput) => {
  const stats = await getStats(statsInput);
  const average = stats.avg?.toFixed(0);

  return (
    <Container as="section">
      <Grid haveGutters align="center">
        <GridCol md={4} lg={5} />
        <GridCol sm={12} md={4} lg={2}>
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
        <GridCol md={4} lg={5} />
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
        <GridCol sm={12} md={10} lg={8}>
          <ClientAnimate>
            <Alert
              severity="warning"
              closable
              description="Les informations de l'entreprise ou de l'UES correspondent à la dernière déclaration."
              small
            />
            <Suspense fallback={<Text variant="lg" text="Chargement des résultats..." />}>
              {/* @ts-ignore */}
              <DisplayCompanies {...searchParams} />
            </Suspense>
          </ClientAnimate>
        </GridCol>
      </Grid>
    </Container>
  );
};

const DisplayCompanies = async (dto: SearchConsultationDTO) => {
  const dtos = await search(dto);
  const count = dtos.count;

  if (count === 0) {
    return <Alert severity="info" title="Aucune entreprise trouvée" description="Veuillez modifier votre recherche." />;
  }

  let totalLength = dtos.data.length;
  const pages = await Promise.all(
    times(dto.page, async i => {
      const dtos = await search({
        ...dto,
        page: i + 1,
      });
      totalLength += dtos.data.length;
      // @ts-ignore
      return <Page dtos={dtos} key={i + 1} />;
    }),
  );

  return (
    <>
      <Container fluid>
        <Heading
          as="h2"
          variant="h4"
          text={`${totalLength} ${count > 10 ? `sur ${count}` : ""} résultat${count > 1 ? "s" : ""}`}
        />
        <ClientAnimate className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {/* @ts-ignore */}
          <Page dtos={dtos} />
          {pages}
        </ClientAnimate>
      </Container>
      <Box mt="3w">
        <ul
          className={fr.cx(
            "fr-btns-group",
            "fr-btns-group--inline-sm",
            "fr-btns-group--left",
            "fr-btns-group--icon-left",
          )}
        >
          <li>
            <ScrollTopButton smooth skipHeader>
              Haut de page
            </ScrollTopButton>
          </li>
          {totalLength < count && (
            <li>
              <Suspense>
                <NextPageLink />
              </Suspense>
            </li>
          )}
        </ul>
      </Box>
    </>
  );
};

const Page = async ({ dtos }: { dtos: ConsultationDTO<SearchDeclarationResultDTO> }) => {
  return (
    <Suspense>
      {dtos.data.map(dto => (
        <GridCol key={dto.siren}>
          <TileCompanyIndex {...dto} />
        </GridCol>
      ))}
    </Suspense>
  );
};
