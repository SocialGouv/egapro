/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { config } from "@common/config";
import { searchRepresentationEquilibreeDTOSchema } from "@common/core-domain/dtos/SearchRepresentationEquilibreeDTO";
import { withSearchParamsValidation } from "@common/utils/next";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { Box, Container, DetailedDownload, Grid, GridCol, Heading, Text } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { isEmpty } from "lodash";
import { Suspense } from "react";

import { SearchSirenForm } from "../../SearchSirenForm";
import { DisplayRepeqResults } from "./DisplayRepeqResults";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Représentation équilibrée",
  description: "Page de recherche de la représentation équilibrée",
  openGraph: {
    title: "Représentation équilibrée",
  },
};

export default withSearchParamsValidation(searchRepresentationEquilibreeDTOSchema)(
  async ({ searchParams, searchParamsError }) => {
    const { limit: _, page, ...partialSearchParams } = searchParams;

    const isLanding = isEmpty(partialSearchParams) && page === 0;
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
              <Heading as="h1" variant="h5" text="Rechercher la représentation équilibrée d'une entreprise" />
              <SearchSirenForm searchParams={searchParams} />
            </GridCol>
          </Grid>
        </Container>
        <Box style={{ backgroundColor: "var(--background-alt-grey)" }} className={fr.cx("fr-pb-6w", "fr-pt-4w")}>
          <Container as="section">
            <Grid haveGutters align="center">
              <GridCol sm={12} md={10} xl={8}>
                <ClientAnimate>
                  {!searchParamsError && !isLanding && (
                    <Suspense fallback={<Text variant="lg" text="Chargement des résultats..." />}>
                      {/* @ts-ignore */}
                      <DisplayRepeqResults {...searchParams} />
                    </Suspense>
                  )}
                </ClientAnimate>
                {/* @ts-ignore */}
                <DetailedDownload
                  href={new URL("/dgt-export-representation.xlsx", config.host).toString()}
                  label={date => `Télécharger le fichier des représentations équilibrées au ${date}`}
                  className={fr.cx("fr-mb-0")}
                />
              </GridCol>
            </Grid>
          </Container>
        </Box>
      </>
    );
  },
);
