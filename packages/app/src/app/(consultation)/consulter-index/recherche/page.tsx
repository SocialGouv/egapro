/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { declarationSearchRepo } from "@api/core-domain/repo";
import { SearchDeclaration } from "@api/core-domain/useCases/SearchDeclaration";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type ConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import {
  type SearchDeclarationInputDTO,
  type SearchDeclarationResultDTO,
} from "@common/core-domain/dtos/SearchDeclarationDTO";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Container, Grid, GridCol, Heading, Text } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { ScrollTopButton } from "@design-system/utils/client/ScrollTopButton";
import { isEmpty } from "lodash";
import { TileCompanyIndex } from "packages/app/src/design-system/base/client/TileCompanyIndex";
import QueryString from "querystring";
import { Suspense } from "react";

import { FormSearchSiren, type FormTypeInput } from "../../FormSearchSiren";
import { NextPageLink } from "../../representation-equilibree/recherche/NextPageLink";

export const dynamic = "force-dynamic";

const useCase = new SearchDeclaration(declarationSearchRepo);

const search = async (input: FormTypeInput, pageIndex = 0) => {
  const criteria: SearchDeclarationInputDTO = {};
  const cleaned = new URLSearchParams(QueryString.stringify(input));
  const q = cleaned.get("q");
  const region = cleaned.get("region");
  const departement = cleaned.get("departement");
  const naf = cleaned.get("naf");

  // clean
  if (q) criteria.query = q;
  if (region) criteria.regionCode = region as typeof criteria.regionCode;
  if (departement) criteria.countyCode = departement as typeof criteria.countyCode;
  if (naf) criteria.nafSection = naf as typeof criteria.nafSection;
  if (pageIndex > 0) criteria.offset = pageIndex * 10;

  return useCase.execute(criteria);
};

type WithPageFormType = FormTypeInput & { page?: string };
const ConsulterIndexRecherche = ({
  searchParams: { page = "0", ...searchParams },
}: NextServerPageProps<"", WithPageFormType>) => {
  let pageNumber = Number(page);
  pageNumber = isFinite(pageNumber) ? Math.max(0, pageNumber) : 0;

  return (
    <>
      <Container as="section">
        <Grid haveGutters align="center">
          <GridCol sm={12} md={10} lg={8}>
            <Heading as="h1" variant="h5" text="Rechercher l'index de l'égalité professionnelle d'une entreprise" />
            <Suspense>
              <FormSearchSiren searchParams={searchParams} />
            </Suspense>
          </GridCol>
        </Grid>
      </Container>
      <Box style={{ backgroundColor: "var(--background-alt-grey)" }} className={fr.cx("fr-pb-4w")}>
        <Container as="section">
          <Grid haveGutters align="center">
            <GridCol sm={12} md={10} lg={8}>
              <ClientAnimate>
                {!isEmpty(searchParams) && (
                  <Suspense fallback={<Text variant="lg" text="Chargement des résultats..." />}>
                    {/* @ts-ignore */}
                    <DisplayCompanies page={pageNumber} searchParams={searchParams} />
                  </Suspense>
                )}
              </ClientAnimate>
            </GridCol>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

const DisplayCompanies = async ({ page, searchParams }: { page: number; searchParams: FormTypeInput }) => {
  const dtos = await search(searchParams);
  const count = dtos.count;

  if (count === 0) {
    return <Alert severity="info" title="Aucune entreprise trouvée" description="Veuillez modifier votre recherche." />;
  }

  let totalLength = dtos.data.length;
  const pages = await Promise.all(
    [...Array(page)].map(async (_, i) => {
      const dtos = await search(searchParams, i + 1);
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

export default ConsulterIndexRecherche;
