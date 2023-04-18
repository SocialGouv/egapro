"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { usePathname } from "next/navigation";

export interface NextPageLinkProps {
  count: number;
  currentPage: number;
  strParams: string;
}

export const NextPageLink = ({ strParams, count, currentPage }: NextPageLinkProps) => {
  const pathname = usePathname();
  console.log({ pathname, strParams, count, currentPage });
  return (
    // <div className="fr-mt-3w">
    //   <Button linkProps={{ href: `${pathname}?${strParams}` }} priority="secondary">
    //     Voir les résultats suivants
    //   </Button>
    // </div>
    <Pagination
      count={count}
      defaultPage={currentPage}
      getPageLinkProps={pageNumber => {
        const searchParams = new URLSearchParams(strParams);
        searchParams.set("page", String(pageNumber));

        console.log("==pagelink", pageNumber, searchParams.toString());

        return {
          href: `${pathname}?${searchParams.toString()}`,
        };
      }}
    />
  );
};
