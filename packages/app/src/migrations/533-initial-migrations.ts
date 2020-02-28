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
  console.log("number of records to migrate", data.length);

  data.map((dataWrapper: any) => {
    let record = dataWrapper.data;
    console.log("data", record.effectif);

    console.log(">>> updating data.effectif.totalNombreSalaries");
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

    console.log(
      ">>> updating data.indicateurUn.remunerationAnnuelle.[].ecartTauxRemuneration"
    );
    const remunerationAnnuelle = calculEcartTauxRemunerationParTrancheAgeCSP(
      record.indicateurUn.remunerationAnnuelle
    );
    record = {
      ...record,
      indicateurUn: { ...record.indicateurUn, remunerationAnnuelle }
    };

    console.log(
      ">>> updating data.indicateurUn.coefficient.x.ecartTauxRemuneration"
    );
    const coefficient = calculEcartTauxRemunerationParTrancheAgeCoef(
      record.indicateurUn.coefficient
    );
    record = {
      ...record,
      indicateurUn: { ...record.indicateurUn, coefficient }
    };

    console.log("updated record", record);
  });
}

migrate();

export default migrate;
