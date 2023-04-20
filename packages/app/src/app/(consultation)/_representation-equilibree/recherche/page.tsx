/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { config } from "@common/config";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Container, Grid, GridCol, Heading } from "@design-system";
import { TileCompanyRepeqs } from "@design-system/client";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { ScrollTopButton } from "@design-system/utils/client/ScrollTopButton";
import { fetchSearchRepeqsV2, type RepeqsType } from "@services/apiClient/useSearchRepeqsV2";
import _ from "lodash";
import Link from "next/link";
import { Suspense } from "react";

import { DetailedDownload } from "../../../../design-system/base/DetailedDownload";
import { FormSearchSiren, type FormTypeInput } from "./FormSearchSiren";
import { NextPageLink } from "./NextPageLink";

type WithPageFormType = FormTypeInput & { page?: string };
const ConsulterRepEq = async ({
  searchParams: { page = "0", ...searchParams },
}: NextServerPageProps<"", WithPageFormType>) => {
  let pageNumber = Number(page);
  pageNumber = _.isFinite(pageNumber) ? Math.max(0, pageNumber) : 0;

  //  dsfrClassName="fr-mb-4w"
  return (
    <>
      <Container as="section">
        <Grid haveGutters align="center">
          <GridCol sm={12} md={10} lg={8}>
            <Box>
              <Heading as="h1" variant="h5" text="Rechercher la représentation équilibrée d'une entreprise" />
              <Suspense>
                <FormSearchSiren searchParams={searchParams} />
              </Suspense>
            </Box>
          </GridCol>
        </Grid>
      </Container>
      <Box style={{ backgroundColor: "var(--background-alt-grey)" }} dsfrClassName="fr-pb-4w">
        <Container as="section">
          <Grid haveGutters align="center">
            <GridCol sm={12} md={10} lg={8}>
              <ClientAnimate>
                {!_.isEmpty(searchParams) && (
                  // @ts-ignore
                  <DisplayRepeqs page={pageNumber} searchParams={searchParams} />
                )}
              </ClientAnimate>
              {/* @ts-ignore */}
              <DetailedDownload
                href={new URL("/dgt-export-representation.xlsx", config.host).toString()}
                label={date => `Télécharger le fichier des représentations équilibrées au ${date}`}
              />
              <Link href="/_consulter-index">Rechercher l'index de l'égalité professionnelle d'une entreprise</Link>
            </GridCol>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

const DisplayRepeqs = async ({ page, searchParams }: { page: number; searchParams: FormTypeInput }) => {
  const repeqs = await fetchSearchRepeqsV2(searchParams);
  const count = repeqs.count;

  if (count === 0) {
    return <Alert severity="info" title="Aucune entreprise trouvée" description="Veuillez modifier votre recherche." />;
  }

  let totalLength = repeqs.data.length;
  const pages = await Promise.all(
    [...Array(page)].map(async (_, i) => {
      const repeqs = await fetchSearchRepeqsV2(searchParams, i + 1);
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
        <ScrollTopButton smooth skipHeader title="Revenir en haut" priority="tertiary" className={fr.cx("fr-mr-3w")}>
          Revenir en haut
        </ScrollTopButton>
        {totalLength < count && (
          <Suspense>
            <NextPageLink />
          </Suspense>
        )}
      </Box>
    </>
  );
};

const Page = async ({ repeqs }: { repeqs: RepeqsType }) => {
  return (
    <Suspense>
      {repeqs.data.map(repeq => (
        <GridCol key={repeq.entreprise.siren}>
          <TileCompanyRepeqs {...repeq} />
        </GridCol>
      ))}
    </Suspense>
  );
};

export default ConsulterRepEq;
