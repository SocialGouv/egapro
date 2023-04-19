/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, GridCol } from "@design-system";
import { TileCompanyRepeqs } from "@design-system/client";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { fetchSearchRepeqsV2, type RepeqsType } from "@services/apiClient/useSearchRepeqsV2";
import _ from "lodash";
import Link from "next/link";
import { Suspense } from "react";

import { DownloadFileZone } from "./DownloadFileZone";
import { FormSearchSiren, type FormTypeInput } from "./FormSearchSiren";
import { NextPageLink } from "./NextPageLink";

type WithPageFormType = FormTypeInput & { page?: string };
const ConsulterRepEq = async ({
  searchParams: { page = "0", ...searchParams },
}: NextServerPageProps<"", WithPageFormType>) => {
  let pageNumber = Number(page);
  pageNumber = _.isFinite(pageNumber) ? Math.max(0, pageNumber) : 0;

  return (
    <Box dsfrClassName="fr-mb-4w">
      <h1 className={fr.cx("fr-h2")}>Rechercher la représentation équilibrée d'une entreprise</h1>
      <Suspense>
        <FormSearchSiren searchParams={searchParams} />
      </Suspense>
      <ClientAnimate>
        {!_.isEmpty(searchParams) && (
          // @ts-ignore
          <DisplayRepeqs page={pageNumber} searchParams={searchParams} />
        )}
      </ClientAnimate>
      {/* @ts-ignore */}
      <DownloadFileZone />
      <Link href="/_consulter-index">Rechercher l'index de l'égalité professionnelle d'une entreprise</Link>
    </Box>
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
      <Box dsfrClassName="fr-mt-3w">
        {totalLength} {count > 10 ? `sur ${count}` : ""} résultat{count > 1 ? "s" : ""}
        <ClientAnimate className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {/* @ts-ignore */}
          <Page repeqs={repeqs} />
          {pages}
        </ClientAnimate>
      </Box>
      {totalLength < count && (
        <Suspense>
          <NextPageLink />
        </Suspense>
      )}
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
