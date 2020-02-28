// @ts-nocheck

import KintoClient from "kinto-http";
import fetch from "node-fetch";
import totalNombreSalaries from "../utils/totalNombreSalaries";

// @ts-ignore
global.fetch = fetch;

async function migrate() {
  const credentials = Buffer.from("admin:passw0rd").toString("base64");

  const client = new KintoClient("http://localhost:8888/v1", {
    headers: {
      Authorization: "Basic " + credentials
    }
  });

  let { data, hasNextPage, next } = await client
    .bucket("egapro")
    .collection("indicators_datas")
    .listRecords({
      filters: {
        "has_data.effectif.nombreSalariesTotal": false,
        "data.declaration.formValidated": "Valid"
      }
    });
  while (hasNextPage) {
    const result = await next();
    data = data.concat(result.data);
    hasNextPage = result.hasNextPage;
  }
  console.log("data", data);
  console.log("number of records to migrate", data.length);

  data.map(dataWrapper => {
    const record = dataWrapper.data;
    console.log("data", record.effectif);
    const result = totalNombreSalaries(record.effectif.nombreSalaries);
    console.log("result", result);

    console.log(">>> updating data.effectif.totalNombreSalaries");
    const { totalNombreSalariesHomme, totalNombreSalariesFemme } = result;
    const total =
      totalNombreSalariesHomme !== undefined &&
      totalNombreSalariesFemme !== undefined
        ? totalNombreSalariesHomme + totalNombreSalariesFemme
        : undefined;
    const updatedRecord = {
      ...record,
      effectif: { ...record.effectif, totalNombreSalaries: total }
    };

    console.log("updated record", updatedRecord);
  });
}

migrate();

export default migrate;
