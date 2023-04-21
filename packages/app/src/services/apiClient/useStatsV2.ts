import { config } from "@common/config";
import QueryString from "querystring";

export type StatsType = {
  avg: number;
  count: number;
  max: number;
  min: number;
};

export type UseStatsParams = {
  departement?: string;
  region?: string;
  section_naf?: string;
  year?: string;
};

/**
 * @todo
 * @deprecated Transform to useCase and direct call db
 */
export const fetchStatsV2 = async (params?: UseStatsParams): Promise<StatsType | null> => {
  const cleaned = new URLSearchParams(QueryString.stringify(params));
  const departement = cleaned.get("departement");
  const region = cleaned.get("region");
  const section_naf = cleaned.get("section_naf");
  const year = cleaned.get("year");

  // clean
  const searchParams = new URLSearchParams();
  departement && searchParams.set("departement", departement);
  region && searchParams.set("region", region);
  section_naf && searchParams.set("section_naf", section_naf);
  year && searchParams.set("year", String(+year - 1));

  const url = new URL(`${config.api_url}/stats?${searchParams.toString()}`);

  const response = await fetch(url, {
    next: {
      revalidate: 30,
    },
  });

  if (response.ok) {
    return await response.json();
  }

  throw new Error("Stats fail.", {
    cause: {
      status: response.status,
      statusText: response.statusText,
    },
  });
};
