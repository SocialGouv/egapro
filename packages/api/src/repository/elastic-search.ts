import { Client } from "@elastic/elasticsearch";
import { IndicatorsData } from "../model";

interface ElasticRequestOptions {
  size?: number;
  from?: number;
  sortBy?: string;
  order?: string;
}

interface RequestResult {
  data: IndicatorsData[];
  total: number;
}

export const request = async (
  nomEntreprise: string,
  { size = 10, from = 0, sortBy, order = "asc" }: ElasticRequestOptions
): Promise<RequestResult> => {
  try {
    const sort = sortBy ? [{ [`${sortBy}.raw`]: { order } }] : [];
    const client = new Client({
      auth: {
        password: process.env.ELASTIC_SEARCH_PASSWORD || "",
        username: process.env.ELASTIC_SEARCH_USER || "",
      },
      node: process.env.ELASTIC_SEARCH_URL || "",
    });

    const response = await client.search({
      body: {
        from,
        query: {
          match: {
            "data.informationsEntreprise.nomEntreprise": {
              operator: "and",
              query: nomEntreprise,
            },
          },
        },
        size,
        sort,
      },
      index: process.env.ELASTIC_SEARCH_INDEX || "declarations",
    });
    const {
      total: { value: total },
      hits,
    } = response.body.hits;
    return {
      data: hits.map(({ _source }: { _source: any }) => _source),
      total,
    };
  } catch (error) {
    return { data: [], total: 0 };
  }
};
