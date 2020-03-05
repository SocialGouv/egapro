const { Client } = require("@elastic/elasticsearch");
const isAfter = require("date-fns/isAfter");
const parse = require("date-fns/parse");

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
              search_analyzer: "search_autocomplete",
              fields: {
                raw: {
                  type: "keyword"
                }
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
  console.log(indexName);
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
                  filter: ["asciifolding", "lowercase", "autocomplete_filter"]
                },
                search_autocomplete: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: ["asciifolding", "lowercase"]
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
    console.log(error.meta.body.error);
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

const isPublicEffectif = record =>
  record.data.informations &&
  (record.data.informations.trancheEffectifs === "1000 et plus" ||
    (record.data.informations.anneeDeclaration === 2018 &&
      record.data.informations.trancheEffectifs === "Plus de 250" &&
      record.data.effectif.nombreSalariesTotal > 1000));

const parseFrenchDate = dateString =>
  parse(dateString, "dd/MM/yyyy HH:mm", new Date(), {
    locale: "fr"
  });

const isLatestRecord = (record, index, collection) => {
  // find same declarations (siren, annee)
  const similars = collection
    .filter(record2 => record2.id !== record.id)
    .filter(
      record2 =>
        record2.data.informationsEntreprise.siren ===
        record.data.informationsEntreprise.siren
    )
    .filter(
      record2 =>
        record2.data.informations.anneeDeclaration ===
        record.data.informations.anneeDeclaration
    );
  if (similars.length) {
    // check if there are other in the future
    const futureDeclarations = similars.filter(record2 =>
      isAfter(
        parseFrenchDate(record2.data.declaration.dateDeclaration),
        parseFrenchDate(record.data.declaration.dateDeclaration)
      )
    );
    if (futureDeclarations.length) {
      return false;
    }
  }
  return true;
};

const indexableDocuments = documents
  .filter(isPublicEffectif)
  .filter(isLatestRecord);

console.log("documents: ", documents.length);
console.log("indexableDocuments:", indexableDocuments.length);

startIndexing(indexableDocuments);
