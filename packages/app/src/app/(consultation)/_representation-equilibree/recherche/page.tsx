/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import { type NextServerPageProps } from "@common/utils/next";
import { Alert, AlertTitle, Box } from "@design-system";
import { TileCompanyRepeqs } from "@design-system/client";
import { type RepeqsType, useSearchRepeqsV2 } from "@services/apiClient/useSearchRepeqsV2";
import _ from "lodash";
import Link from "next/link";
import { type ReactElement, Suspense } from "react";

import { DownloadFileZone } from "./DownloadFileZone";
import { FormSearchSiren, type FormTypeInput } from "./FormSearchSiren";

type WithPageFormType = FormTypeInput & { page?: string };
const ConsulterRepEq = async ({
  searchParams: { page = "1", ...searchParams },
}: NextServerPageProps<"", WithPageFormType>) => {
  let pageNumber = Number(page);
  pageNumber = _.isFinite(pageNumber) ? Math.max(1, pageNumber) : 1;
  const { cleanedParams, searchResult } = await useSearchRepeqsV2(searchParams, pageNumber - 1);
  console.log("ConsulterRepEq page generated");

  // console.log(cleanedParams.toString(), params.toString(), page);
  // params.append("page", String(pageNumber + 1));

  const pagination = (
    <Pagination
      count={Math.ceil(searchResult.count / 10)}
      defaultPage={pageNumber}
      getPageLinkProps={num => {
        const params = new URLSearchParams(cleanedParams);
        params.delete("offset");
        params.set("page", String(num));

        console.log("==pagelink", num, params.toString());

        return {
          href: `?${params.toString()}`,
        };
      }}
    />
  );

  return (
    <Box mb="4w">
      <h1 className="fr-h2">Rechercher la représentation équilibrée d'une entreprise</h1>
      <Suspense>
        <FormSearchSiren searchParams={searchParams} />
      </Suspense>
      <div>
        <DisplayRepeqs pagination={pagination} page={pageNumber} repeqs={searchResult} />
        {pagination}
      </div>
      {/* @ts-ignore */}
      <DownloadFileZone />
      <Link href="/_consulter-index">Rechercher l'index de l'égalité professionnelle d'une entreprise</Link>
    </Box>
  );
};

const DisplayRepeqs = ({
  page,
  repeqs,
  pagination,
}: {
  page: number;
  pagination: ReactElement;
  repeqs: RepeqsType;
}) => {
  const count = repeqs.count;
  if (count === 0) {
    return (
      <Alert type="info" mt="3w">
        <AlertTitle as="h2">Aucune entreprise trouvée.</AlertTitle>
        <p>Veuillez modifier votre recherche.</p>
      </Alert>
    );
  }

  const itemsOnPage = Math.min(count, 10 * page);
  const substract = Math.min(9, count - 1 - (page - 1) * 10);
  const results = `${itemsOnPage - substract}-${itemsOnPage}`;

  return (
    <div className="fr-mt-3w">
      {results} sur {count}
      {pagination}
      <div className="fr-grid-row fr-grid-row--gutters">
        {repeqs.data.map(repeq => (
          <div key={repeq.entreprise.siren} className="fr-col-12">
            <TileCompanyRepeqs {...repeq} />
          </div>
        ))}
      </div>
    </div>
  );
};

// export const dynamic = "force-dynamic";

export default ConsulterRepEq;
