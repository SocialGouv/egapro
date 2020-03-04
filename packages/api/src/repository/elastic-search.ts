import { Client } from "@elastic/elasticsearch";
import { IndicatorsData } from "../model";

const client = new Client({
  auth: {
    password: process.env.ELASTIC_SEARCH_PASSWORD || "",
    username: process.env.ELASTIC_SEARCH_USER || ""
  },
  node: process.env.ELASTIC_SEARCH_URL || ""
});

interface ElasticRequestOptions {
  size?: number;
  from?: number;
}

interface RequestResult {
  data: IndicatorsData[];
  total: number;
}

export const request = async (
  nomEntreprise: string,
  { size = 10, from = 0 }: ElasticRequestOptions
): Promise<RequestResult> => {
  try {
    const response = await client.search({
      body: {
        from,
        query: {
          match: {
            "data.informationsEntreprise.nomEntreprise": {
              query: nomEntreprise
            }
          }
        },
        size
      },
      index: "declarations"
    });
    const {
      total: { value: total },
      hits
    } = response.body.hits;
    return {
      data: hits.map(({ _source }: { _source: any }) => _source),
      total
    };
  } catch (error) {
    return { data: [], total: 0 };
  }
};
