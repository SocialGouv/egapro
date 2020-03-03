import { Client } from "@elastic/elasticsearch";

const client = new Client({
  auth: {
    password: process.env.ELASTIC_SEARCH_PASSWORD || "",
    username: process.env.ELASTIC_SEARCH_USER || ""
  },
  node: process.env.ELASTIC_SEARCH_URL || ""
});

export const request = async (nomEntreprise: string) => {
  try {
    const response = await client.search({
      body: {
        query: {
          match: {
            "data.informationsEntreprise.nomEntreprise": {
              query: nomEntreprise
            }
          }
        }
      },
      index: "declarations"
    });
    return response.body.hits.hits.map(
      ({ _source }: { _source: any }) => _source
    );
  } catch (error) {
    return [];
  }
};
