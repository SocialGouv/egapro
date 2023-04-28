/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { config } from "@common/config";
import { type ConsultationDTO, type SearchConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import {
  searchRepresentationEquilibreeDTOSchema,
  type SearchRepresentationEquilibreeResultDTO,
} from "@common/core-domain/dtos/SearchRepresentationEquilibreeDTO";
import { type NextServerPageProps, withSearchParamsValidation } from "@common/utils/next";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { Box, Container, DetailedDownload, Grid, GridCol, Heading, Text } from "@design-system";
import { TileCompanyRepeqs } from "@design-system/client";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { NextPageLink } from "@design-system/utils/client/NextPageLink";
import { ScrollTopButton } from "@design-system/utils/client/ScrollTopButton";
import { search } from "@services/server/searchRepresentationEquilibree";
import { isEmpty, times } from "lodash";
import { Suspense } from "react";

import { SearchSirenForm } from "../../SearchSirenForm";

export const dynamic = "force-dynamic";

const Recherche = async ({
  searchParams: { limit, page, ...partialSearchParams },
  searchParamsError,
}: NextServerPageProps<"", typeof searchRepresentationEquilibreeDTOSchema>) => {
  const searchParams = { limit, page, ...partialSearchParams };

  const isLanding = isEmpty(partialSearchParams) && page === 0;
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
            <Heading as="h1" variant="h5" text="Rechercher la représentation équilibrée d'une entreprise" />
            <Suspense>
              <SearchSirenForm searchParams={searchParams} />
            </Suspense>
          </GridCol>
        </Grid>
      </Container>
      <Box style={{ backgroundColor: "var(--background-alt-grey)" }} className={fr.cx("fr-pb-4w")}>
        <Container as="section">
          <Grid haveGutters align="center">
            <GridCol sm={12} md={10} lg={8}>
              <ClientAnimate>
                {!searchParamsError && !isLanding && (
                  <Suspense fallback={<Text variant="lg" text="Chargement des résultats..." />}>
                    {/* @ts-ignore */}
                    <DisplayRepeqs {...searchParams} />
                  </Suspense>
                )}
              </ClientAnimate>
              {/* @ts-ignore */}
              <DetailedDownload
                href={new URL("/dgt-export-representation.xlsx", config.host).toString()}
                label={date => `Télécharger le fichier des représentations équilibrées au ${date}`}
              />
            </GridCol>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

const DisplayRepeqs = async (dto: SearchConsultationDTO) => {
  const repeqs = await search(dto);
  const count = repeqs.count;

  if (count === 0) {
    return <Alert severity="info" title="Aucune entreprise trouvée" description="Veuillez modifier votre recherche." />;
  }

  let totalLength = repeqs.data.length;
  const pages = await Promise.all(
    times(dto.page, async i => {
      const repeqs = await search({
        ...dto,
        page: i + 1,
      });
      totalLength += repeqs.data.length;
      // @ts-ignore
      return <Page repeqs={repeqs} key={i + 1} />;
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
          <Page repeqs={repeqs} />
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

const Page = async ({ dtos }: { dtos: ConsultationDTO<SearchRepresentationEquilibreeResultDTO> }) => {
  return (
    <Suspense>
      {dtos.data.map(dto => {
        return (
          <GridCol key={dto.company.siren}>
            <TileCompanyRepeqs {...dto} />
          </GridCol>
        );
      })}
    </Suspense>
  );
};

export default withSearchParamsValidation(searchRepresentationEquilibreeDTOSchema)(Recherche);

/*
3/
  v-------app----------vv---simu----vv--app--v
- http://egapro.travail.gouv.fr/index-egapro/recherche
- http://egapro.travail.gouv.fr/representation-equilibree/recherche

*/
