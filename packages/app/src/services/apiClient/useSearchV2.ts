import { config } from "@common/config";
import type { CompaniesType } from "@common/models/company";
import QueryString from "querystring";

export type SearchCompanyParams = {
  departement?: string;
  q?: string;
  region?: string;
  section_naf?: string;
};

/** @deprecated */
export const fetchSearchV2 = async (_searchParams = {}, pageIndex = 0): Promise<CompaniesType> => {
  const cleaned = new URLSearchParams(QueryString.stringify(_searchParams));
  const q = cleaned.get("q");
  const region = cleaned.get("region");
  const departement = cleaned.get("departement");
  const naf = cleaned.get("naf");

  // clean
  const searchParams = new URLSearchParams();
  q && searchParams.set("q", q);
  region && searchParams.set("region", region);
  departement && searchParams.set("departement", departement);
  naf && searchParams.set("naf", naf);

  if (pageIndex > 0) searchParams.set("offset", String(pageIndex * 10));

  const url = new URL(`${config.api_url}/search?${searchParams.toString()}`);
  const response = await fetch(url, {
    next: {
      revalidate: 0,
    },
  });

  if (response.ok) {
    return await response.json();
  }

  console.error("Search failed", response.status, response.statusText);
  return { count: 0, data: [] };
};
