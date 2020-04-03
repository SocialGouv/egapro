// @ts-ignore
import KintoClient from "kinto-http";
import fetch from "node-fetch";
import totalNombreSalaries from "../utils/totalNombreSalaries";
import calculIndicateurUn, {
  calculEcartTauxRemunerationParTrancheAgeCSP,
  calculEcartTauxRemunerationParTrancheAgeCoef
} from "../utils/calculsEgaProIndicateurUn";
import calculIndicateurDeux from "../utils/calculsEgaProIndicateurDeux";
import calculIndicateurTrois from "../utils/calculsEgaProIndicateurTrois";
import calculIndicateurDeuxTrois from "../utils/calculsEgaProIndicateurDeuxTrois";
import calculIndicateurQuatre from "../utils/calculsEgaProIndicateurQuatre";

// @ts-ignore
global.fetch = fetch;

async function migrate() {
  const [data, batchUpdate] = await getData();
  console.log("Nombre d'enregistrements à migrer", data.length);

  await migrateTotalNombreSalaries(data);
  await migrateEcartTauxRemunerationCSP(data);
  await migrateEcartTauxRemunerationCoef(data);
  await migrateNonCalculable(data);

  console.log(">>> Sending the batch of updates");
  const result = await batchUpdate((batch: any) => {
    data.map((record: any) => batch.updateRecord(record));
  });
}

async function getData() {
  const credentials = Buffer.from("admin:passw0rd").toString("base64");
  const client = new KintoClient("http://localhost:8888/v1", {
    headers: {
      Authorization: "Basic " + credentials
    }
  });
  const collection = client.bucket("egapro").collection("indicators_datas");

  let { data, hasNextPage, next } = await collection.listRecords({
    filters: {
      "data.declaration.formValidated": "Valid"
    }
  });
  while (hasNextPage) {
    const result = await next();
    data = data.concat(result.data);
    hasNextPage = result.hasNextPage;
  }
  return [data, collection.batch.bind(collection)];
}

async function migrateTotalNombreSalaries(records: Array<any>) {
  console.log(">>> updating data.effectif.totalNombreSalaries");
  records.map((record: any) => {
    const {
      totalNombreSalariesHomme,
      totalNombreSalariesFemme
    } = totalNombreSalaries(record.data.effectif.nombreSalaries);
    const total =
      totalNombreSalariesHomme !== undefined &&
      totalNombreSalariesFemme !== undefined
        ? totalNombreSalariesHomme + totalNombreSalariesFemme
        : undefined;
    record.data = {
      ...record.data,
      effectif: { ...record.data.effectif, totalNombreSalaries: total }
    };
  });
  return records;
}

async function migrateEcartTauxRemunerationCSP(records: Array<object>) {
  console.log(
    ">>> updating data.indicateurUn.remunerationAnnuelle.[].ecartTauxRemuneration"
  );

  records.map((record: any) => {
    const remunerationAnnuelle = calculEcartTauxRemunerationParTrancheAgeCSP(
      record.data.indicateurUn.remunerationAnnuelle
    );
    record.data = {
      ...record.data,
      indicateurUn: { ...record.data.indicateurUn, remunerationAnnuelle }
    };
  });
  return records;
}

async function migrateEcartTauxRemunerationCoef(records: Array<object>) {
  console.log(
    ">>> updating data.indicateurUn.coefficient.x.ecartTauxRemuneration"
  );

  records.map((record: any) => {
    const coefficient = calculEcartTauxRemunerationParTrancheAgeCoef(
      record.data.indicateurUn.coefficient
    );
    record.data = {
      ...record.data,
      indicateurUn: { ...record.data.indicateurUn, coefficient }
    };
  });
  return records;
}

async function migrateNonCalculable(records: Array<object>) {
  console.log(">>> updating data.indicateurX.nonCalculable");

  records.map((record: any) => {
    const {
      effectifsIndicateurCalculable: indicateurUnCalculable
    } = calculIndicateurUn(record.data);
    const {
      effectifsIndicateurCalculable: indicateurDeuxCalculable
    } = calculIndicateurDeux(record.data);
    const {
      effectifsIndicateurCalculable: indicateurTroisCalculable
    } = calculIndicateurTrois(record.data);
    const {
      effectifsIndicateurCalculable: indicateurDeuxTroisCalculable
    } = calculIndicateurDeuxTrois(record.data);
    const {
      indicateurCalculable: indicateurQuatreCalculable
    } = calculIndicateurQuatre(record.data);
    record.data = {
      ...record.data,
      indicateurUn: {
        ...record.data.indicateurUn,
        nonCalculable: !indicateurUnCalculable
      },
      indicateurDeux: {
        ...record.data.indicateurDeux,
        nonCalculable: !indicateurDeuxCalculable
      },
      indicateurTrois: {
        ...record.data.indicateurTrois,
        nonCalculable: !indicateurTroisCalculable
      },
      indicateurDeuxTrois: {
        ...record.data.indicateurDeuxTrois,
        nonCalculable: !indicateurDeuxTroisCalculable
      },
      indicateurQuatre: {
        ...record.data.indicateurQuatre,
        nonCalculable: !indicateurQuatreCalculable
      }
    };
  });
  return records;
}

migrate();
