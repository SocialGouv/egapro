const { Client } = require("@elastic/elasticsearch");

// write permissions
const client = new Client({
  cloud: { id: process.env.ES_ID },
  auth: {
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD
  }
});

const declarationsMapping = {
  properties: {
    data: {
      properties: {
        informationsEntreprise: {
          type: "object",
          properties: {
            nomEntreprise: {
              type: "text",
              analyzer: "autocomplete",
              search_analyzer: "standard"
            },
            // We make a raw copy of the field to be able to sort it fast
            fields: {
              raw: {
                "type": "keyword"
              }
            }
          }
        }
      }
    }
  }
};

async function createIndex({ client, indexName, mappings }) {
  const { body } = await client.indices.exists({ index: indexName });
  if (body) {
    try {
      await client.indices.delete({ index: indexName });
      console.log(`Index ${indexName} deleted.`);
    } catch (error) {
      console.log("index delete", error);
    }
  }
  try {
    await client.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
          index: {
            analysis: {
              filter: {
                autocomplete_filter: {
                  type: "edge_ngram",
                  min_gram: 1,
                  max_gram: 20
                }
              },
              analyzer: {
                autocomplete: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: ["lowercase", "autocomplete_filter"]
                }
              }
            }
          }
        },
        mappings
      }
    });
    console.log(`Index ${indexName} created.`);
  } catch (error) {
    console.log("index create", error);
  }
}

const INDEX_NAME = "declarations";

const startIndexing = async documents => {
  const ts = Date.now();
  const tmpIndexName = `${INDEX_NAME}-${ts}`;

  // create index
  console.log("Creating index", tmpIndexName);
  await createIndex({
    client,
    indexName: tmpIndexName,
    mappings: declarationsMapping
  });

  // inject data
  console.log(
    "Injecting data, number of documents to index:",
    documents.length
  );
  const body = documents.flatMap(doc => [
    { index: { _index: tmpIndexName } },
    doc
  ]);

  //  console.log("body", body);
  try {
    const res = await client.bulk({ refresh: true, body });
    //console.log("res", res);
  } catch (e) {
    console.log("e", e.meta.body.error);
  }

  // if (bulkResponse.errors) {
  //   console.log(bulkResponse.errors);
  // }

  // update aliases
  console.log("Updating aliases");
  await client.indices.updateAliases({
    body: {
      actions: [
        {
          remove: {
            index: `${INDEX_NAME}-*`,
            alias: `${INDEX_NAME}`
          }
        },
        {
          add: {
            index: `${INDEX_NAME}-${ts}`,
            alias: `${INDEX_NAME}`
          }
        }
      ]
    }
  });
};

console.log("Indexing the file", process.env.JSON_DUMP_FILENAME);
const documents = require(process.env.JSON_DUMP_FILENAME);

const isIndexable = record =>
  record.data.informations &&
  (record.data.informations.trancheEffectifs === "1000 et plus" ||
    (record.data.informations.anneeDeclaration === 2018 &&
      record.data.informations.trancheEffectifs === "Plus de 250" &&
      record.data.effectif.nombreSalariesTotal > 1000));

startIndexing(documents.filter(isIndexable));
