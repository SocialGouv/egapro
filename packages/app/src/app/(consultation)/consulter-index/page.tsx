/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { declarationSearchRepo } from "@api/core-domain/repo";
import { type DeclarationStatsCriteria } from "@api/core-domain/repo/IDeclarationSearchRepo";
import { GetDeclarationStats } from "@api/core-domain/useCases/GetDeclarationStats";
import { fr } from "@codegouvfr/react-dsfr";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { config } from "@common/config";
import { DISPLAY_CURRENT_YEAR, DISPLAY_PUBLIC_YEARS } from "@common/dict";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Container, Grid, GridCol, Heading, Stat } from "@design-system";
import { SimpleSubmitForm } from "@design-system/utils/client/SimpleSubmitForm";
import { DetailedDownload } from "packages/app/src/design-system/base/DetailedDownload";
import QueryString from "querystring";

import { AverageIndicatorForm, type AverageIndicatorFormType } from "./AverageIndicatorForm";

export const dynamic = "force-dynamic";

const useCase = new GetDeclarationStats(declarationSearchRepo);

const getStats = async (input: AverageIndicatorFormType) => {
  const criteria: DeclarationStatsCriteria = {};
  const cleaned = new URLSearchParams(QueryString.stringify(input));
  const departement = cleaned.get("departement");
  const region = cleaned.get("region");
  const section_naf = cleaned.get("section_naf");
  const year = cleaned.get("year");

  if (departement) criteria.countyCode = departement as typeof criteria.countyCode;
  if (region) criteria.regionCode = region as typeof criteria.regionCode;
  if (section_naf) criteria.nafSection = section_naf as typeof criteria.nafSection;
  if (year) criteria.year = year as typeof criteria.year;

  return useCase.execute(criteria);
};

const ConsulterIndex = async ({ searchParams }: NextServerPageProps<"", AverageIndicatorFormType>) => {
  const intYear = parseInt(String(searchParams.year)) || DISPLAY_CURRENT_YEAR;
  searchParams.year = String(DISPLAY_PUBLIC_YEARS.includes(intYear) ? intYear : DISPLAY_CURRENT_YEAR);

  let average = "";
  try {
    const stats = await getStats(searchParams as AverageIndicatorFormType);
    average = stats?.avg?.toFixed?.(0) ?? "";
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
