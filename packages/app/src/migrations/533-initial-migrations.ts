// @ts-ignore
import KintoClient from "kinto-http";
import fetch from "node-fetch";
import totalNombreSalaries from "../utils/totalNombreSalaries";
import {
  calculEcartTauxRemunerationParTrancheAgeCSP,
  calculEcartTauxRemunerationParTrancheAgeCoef
} from "../utils/calculsEgaProIndicateurUn";

// @ts-ignore
global.fetch = fetch;

async function migrate() {
  const [data, updateRecords] = await getData();

  await migrateTotalNombreSalaries(data);
  await migrateEcartTauxRemunerationCSP(data);
  await migrateEcartTauxRemunerationCoef(data);

  console.log(">>> Sending the batch of updates");
  updateRecords.batch((batch: any) => {
    // TODO: uncomment
    // data.map(batch.updateRecord);
  });
}

async function getData() {
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
        "data.declaration.formValidated": "Valid"
      }
    });
  while (hasNextPage) {
    const result = await next();
    data = data.concat(result.data);
    hasNextPage = result.hasNextPage;
  }
  return [data, client.bucket("egapro").collection("indicators_datas")];
}

async function migrateTotalNombreSalaries(data: Array<object>) {
  console.log(">>> updating data.effectif.totalNombreSalaries");
  data.map(({ data: record }: any) => {
    const {
      totalNombreSalariesHomme,
      totalNombreSalariesFemme
    } = totalNombreSalaries(record.effectif.nombreSalaries);
    const total =
      totalNombreSalariesHomme !== undefined &&
      totalNombreSalariesFemme !== undefined
        ? totalNombreSalariesHomme + totalNombreSalariesFemme
        : undefined;
    record = {
      ...record,
      effectif: { ...record.effectif, totalNombreSalaries: total }
    };
  });
  return data;
}

async function migrateEcartTauxRemunerationCSP(data: Array<object>) {
  console.log(
    ">>> updating data.indicateurUn.remunerationAnnuelle.[].ecartTauxRemuneration"
  );

  data.map(({ data: record }: any) => {
    const remunerationAnnuelle = calculEcartTauxRemunerationParTrancheAgeCSP(
      record.indicateurUn.remunerationAnnuelle
    );
    record = {
      ...record,
      indicateurUn: { ...record.indicateurUn, remunerationAnnuelle }
    };
  });
  return data;
}

async function migrateEcartTauxRemunerationCoef(data: Array<object>) {
  console.log(
    ">>> updating data.indicateurUn.coefficient.x.ecartTauxRemuneration"
  );

  data.map(({ data: record }: any) => {
    const coefficient = calculEcartTauxRemunerationParTrancheAgeCoef(
      record.indicateurUn.coefficient
    );
    record = {
      ...record,
      indicateurUn: { ...record.indicateurUn, coefficient }
    };
  });
  return data;
}

migrate();
