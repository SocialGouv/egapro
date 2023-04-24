/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { fr } from "@codegouvfr/react-dsfr";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { config } from "@common/config";
import { DISPLAY_CURRENT_YEAR, DISPLAY_PUBLIC_YEARS } from "@common/dict";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Container, Grid, GridCol, Heading, Stat } from "@design-system";
import { SimpleSubmitForm } from "@design-system/utils/client/SimpleSubmitForm";
import { fetchStatsV2 } from "@services/apiClient/useStatsV2";
import { DetailedDownload } from "packages/app/src/design-system/base/DetailedDownload";

import { AverageIndicatorForm, type AverageIndicatorFormType } from "./AverageIndicatorForm";

export const dynamic = "force-dynamic";

const ConsulterIndex = async ({ searchParams }: NextServerPageProps<"", AverageIndicatorFormType>) => {
  const intYear = parseInt(String(searchParams.year)) || DISPLAY_CURRENT_YEAR;
  searchParams.year = String(DISPLAY_PUBLIC_YEARS.includes(intYear) ? intYear : DISPLAY_CURRENT_YEAR);

  let average = "";
  try {
    const stats = await fetchStatsV2(searchParams);
    average = stats?.avg?.toFixed(0) ?? "";
  } catch (e) {
    console.log(e);
  }

  return (
    <>
      <Container as="section">
        <Grid haveGutters align="center">
          <GridCol sm={12} md={10} lg={8}>
            <Heading as="h1" variant="h5" text="Rechercher l'index de l'égalité professionnelle d'une entreprise" />
            <SimpleSubmitForm action="/consulter-index/recherche" noValidate>
              <SearchBar
                big
                label="Rechercher"
                nativeInputProps={{
                  placeholder: "Nom ou numéro de SIREN de l'entreprise",
                  name: "q",
                }}
              />
            </SimpleSubmitForm>
            {/* @ts-ignore */}
            <DetailedDownload
              href={new URL("/index-egalite-fh.xlsx", config.host).toString()}
              label={date => `Télécharger le fichier des entreprises au ${date}`}
            />
          </GridCol>
        </Grid>
      </Container>
      <Box style={{ backgroundColor: "var(--background-alt-grey)" }} className={fr.cx("fr-pb-4w")}>
        <Container as="section">
          <Grid haveGutters align="center">
            <GridCol md={4} lg={5} />
            <GridCol sm={12} md={4} lg={2}>
              {average ? (
                <Stat display={{ asTitle: "lg" }} text={average} helpText={`Index Moyen ${+searchParams.year}`} />
              ) : (
                <Stat display={{ asTitle: "lg" }} text="N/A" helpText={`Index Moyen ${+searchParams.year}`} />
              )}
            </GridCol>
            <GridCol md={4} lg={5} />
            <GridCol sm={12} md={10} lg={8}>
              <AverageIndicatorForm searchParams={searchParams as AverageIndicatorFormType} />
            </GridCol>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default ConsulterIndex;
