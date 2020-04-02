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
  await migrateTotalNombreSalaries();

  await migrateEcartTauxRemunerationCSP();

  await migrateEcartTauxRemunerationCoef();
}

async function getData(filters: { [key: string]: string | boolean | number }) {
  const credentials = Buffer.from("admin:passw0rd").toString("base64");
  const client = new KintoClient("http://localhost:8888/v1", {
    headers: {
      Authorization: "Basic " + credentials
    }
  });

  let { data, hasNextPage, next } = await client
    .bucket("egapro")
    .collection("indicators_datas")
    .listRecords({ filters });
  while (hasNextPage) {
    const result = await next();
    data = data.concat(result.data);
    hasNextPage = result.hasNextPage;
  }
  return [data, client.bucket("egapro").collection("indicators_datas")];
}

async function migrateTotalNombreSalaries() {
  console.log(">>> updating data.effectif.totalNombreSalaries");
  const [data, updateRecords] = await getData({
    "has_data.effectif.nombreSalariesTotal": false,
    "data.declaration.formValidated": "Valid"
  });
  console.log("number of records to migrate", data.length);

  updateRecords.batch((batch: any) => {
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
      // TODO: uncomment
      // batch.updateRecord(record);
    });
  });
}

async function migrateEcartTauxRemunerationCSP() {
  console.log(
    ">>> updating data.indicateurUn.remunerationAnnuelle.[].ecartTauxRemuneration"
  );
  const [data, updateRecords] = await getData({
    "has_data.effectif.nombreSalariesTotal": false,
    "data.declaration.formValidated": "Valid"
  });
  console.log("number of records to migrate", data.length);

  updateRecords.batch((batch: any) => {
    data.map(({ data: record }: any) => {
      const remunerationAnnuelle = calculEcartTauxRemunerationParTrancheAgeCSP(
        record.indicateurUn.remunerationAnnuelle
      );
      record = {
        ...record,
        indicateurUn: { ...record.indicateurUn, remunerationAnnuelle }
      };
      // TODO: uncomment
      // batch.updateRecord(record);
    });
  });
}

async function migrateEcartTauxRemunerationCoef() {
  console.log(
    ">>> updating data.indicateurUn.coefficient.x.ecartTauxRemuneration"
  );
  const [data, updateRecords] = await getData({
    "has_data.effectif.nombreSalariesTotal": false,
    "data.declaration.formValidated": "Valid"
  });
  console.log("number of records to migrate", data.length);

  updateRecords.batch((batch: any) => {
    data.map(({ data: record }: any) => {
      const coefficient = calculEcartTauxRemunerationParTrancheAgeCoef(
        record.indicateurUn.coefficient
      );
      record = {
        ...record,
        indicateurUn: { ...record.indicateurUn, coefficient }
      };
      // TODO: uncomment
      // batch.updateRecord(record);
    });
  });
}

migrate();
