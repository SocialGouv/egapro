import { config } from "@common/config";
import QueryString from "querystring";

export type RepeqType = {
  entreprise: {
    code_naf: string;
    département: string;
    raison_sociale: string;
    région: string;
    siren: string;
  };
  label?: string;
  représentation_équilibrée: Record<
    number,
    {
      motif_non_calculabilité_cadres: ("aucun_cadre_dirigeant" | "un_seul_cadre_dirigeant") | null;
      motif_non_calculabilité_membres: "aucune_instance_dirigeante" | null;
      pourcentage_femmes_cadres: number | null;
      pourcentage_femmes_membres: number | null;
      pourcentage_hommes_cadres: number | null;
      pourcentage_hommes_membres: number | null;
    }
  >;
};

export type RepeqsType = {
  count: number;
  data: RepeqType[];
};

export type SearchParams = {
  departement?: string;
  q?: string;
  region?: string;
  section_naf?: string;
};

export const useSearchRepeqsV2 = async (
  _searchParams = {},
  pageIndex = 0,
): Promise<{ cleanedParams: URLSearchParams; searchResult: RepeqsType }> => {
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

  const url = new URL(`${config.api_url}/representation-equilibree/search?${searchParams.toString()}`);
  const response = await fetch(url, {
    next: {
      revalidate: 10,
    },
  });

  if (response.ok) {
    return { cleanedParams: searchParams, searchResult: await response.json() };
  }

  console.error("Search failed", response.status, response.statusText);
  return { cleanedParams: searchParams, searchResult: { count: 0, data: [] } };
};
