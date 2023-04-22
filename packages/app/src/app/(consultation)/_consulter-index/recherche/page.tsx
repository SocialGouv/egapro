/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type CompaniesType } from "@common/models/company";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Container, Grid, GridCol, Heading } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { ScrollTopButton } from "@design-system/utils/client/ScrollTopButton";
import { fetchSearchV2 } from "@services/apiClient/useSearchV2";
import { isEmpty } from "lodash";
import { TileCompanyIndex } from "packages/app/src/design-system/base/client/TileCompanyIndex";
import { Suspense } from "react";

import { NextPageLink } from "../../_representation-equilibree/recherche/NextPageLink";
import { FormSearchSiren, type FormTypeInput } from "../../FormSearchSiren";

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
                  // @ts-ignore
                  <DisplayCompanies page={pageNumber} searchParams={searchParams} />
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
  const companies = await fetchSearchV2(searchParams);
  const count = companies.count;

  if (count === 0) {
    return <Alert severity="info" title="Aucune entreprise trouvée" description="Veuillez modifier votre recherche." />;
  }

  let totalLength = companies.data.length;
  const pages = await Promise.all(
    [...Array(page)].map(async (_, i) => {
      const companies = await fetchSearchV2(searchParams, i + 1);
      totalLength += companies.data.length;
      // @ts-ignore
      return <Page companies={companies} key={i + 1} />;
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
          <Page companies={companies} />
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

const Page = async ({ companies }: { companies: CompaniesType }) => {
  return (
    <Suspense>
      {companies.data.map(company => (
        <GridCol key={company.entreprise.siren}>
          <TileCompanyIndex {...company} />
        </GridCol>
      ))}
    </Suspense>
  );
};

export default ConsulterIndexRecherche;
