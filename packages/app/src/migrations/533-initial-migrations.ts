// @ts-ignore
import KintoClient from "kinto-http";
import fetch from "node-fetch";
import totalNombreSalaries from "../utils/totalNombreSalaries";
import calculIndicateurUn, {
  calculEcartTauxRemunerationParTrancheAgeCSP,
  calculEcartTauxRemunerationParTrancheAgeCoef,
} from "../utils/calculsEgaProIndicateurUn";
import calculIndicateurDeux from "../utils/calculsEgaProIndicateurDeux";
import calculIndicateurTrois from "../utils/calculsEgaProIndicateurTrois";
import calculIndicateurDeuxTrois from "../utils/calculsEgaProIndicateurDeuxTrois";
import calculIndicateurQuatre from "../utils/calculsEgaProIndicateurQuatre";

// @ts-ignore
global.fetch = fetch;

const KINTO_URL = `http://${process.env.KINTO_SERVER}:8888/v1`;

if (!process.env.KINTO_SERVER) {
  console.log(
    "Error: this script needs an env variable named KINTO_SERVER with the url to the kinto server, like 'localhost' or 'kinto-server'"
  );
  process.exit();
} else {
  console.log("Using the following kinto server URL:", KINTO_URL);
}

async function migrate() {
  console.log(">>> Migrating the data");
  const migratedRecords = await migrateData();
  console.log(">>> Finished migrating", migratedRecords, "records");
}

async function migrateData() {
  const credentials = Buffer.from(
    `${process.env.KINTO_LOGIN}:${process.env.KINTO_PASSWORD}`
  ).toString("base64");
  const client = new KintoClient(KINTO_URL, {
    headers: {
      Authorization: "Basic " + credentials,
    },
  });
  const collection = client.bucket("egapro").collection("indicators_datas");

  let { data, hasNextPage, next } = await collection.listRecords({
    filters: {
      "data.declaration.formValidated": "Valid",
    },
  });
  let count = 0;
  while (true) {
    console.log(">>> Processing a page of data:", data.length, "records");

    await migrateTotalNombreSalaries(data);
    await migrateEcartTauxRemunerationCSP(data);
    await migrateEcartTauxRemunerationCoef(data);
    await migrateNonCalculable(data);

    count += data.length;
    console.log(">>> Sending a batch of updates:", data.length, "records");
    await collection.batch((batch: any) => {
      data.map((record: any) => batch.updateRecord(record));
    });

    if (!hasNextPage) {
      break;
    }
    const result = await next();
    data = result.data;
    hasNextPage = result.hasNextPage;
  }
  return count;
}

async function migrateTotalNombreSalaries(records: Array<any>) {
  console.log(">>> updating data.effectif.totalNombreSalaries");
  records.map((record: any) => {
    try {
      const {
        totalNombreSalariesHomme,
        totalNombreSalariesFemme,
      } = totalNombreSalaries(record.data.effectif.nombreSalaries);
      const total =
        totalNombreSalariesHomme !== undefined &&
        totalNombreSalariesFemme !== undefined
          ? totalNombreSalariesHomme + totalNombreSalariesFemme
          : undefined;
      record.data = {
        ...record.data,
        effectif: { ...record.data.effectif, totalNombreSalaries: total },
      };
    } catch (error) {
      console.log(
        "error while processing record",
        record.id,
        ". Error:",
        error
      );
    }
  });
  return records;
}

async function migrateEcartTauxRemunerationCSP(records: Array<object>) {
  console.log(
    ">>> updating data.indicateurUn.remunerationAnnuelle.[].ecartTauxRemuneration"
  );

  records.map((record: any) => {
    try {
      const remunerationAnnuelle = calculEcartTauxRemunerationParTrancheAgeCSP(
        record.data.indicateurUn.remunerationAnnuelle
      );
      record.data = {
        ...record.data,
        indicateurUn: { ...record.data.indicateurUn, remunerationAnnuelle },
      };
    } catch (error) {
      console.log(
        "error while processing record",
        record.id,
        ". Error:",
        error
      );
    }
  });
  return records;
}

async function migrateEcartTauxRemunerationCoef(records: Array<object>) {
  console.log(
    ">>> updating data.indicateurUn.coefficient.x.ecartTauxRemuneration"
  );

  records.map((record: any) => {
    try {
      const coefficient = calculEcartTauxRemunerationParTrancheAgeCoef(
        record.data.indicateurUn.coefficient
      );
      record.data = {
        ...record.data,
        indicateurUn: { ...record.data.indicateurUn, coefficient },
      };
    } catch (error) {
      console.log(
        "error while processing record",
        record.id,
        ". Error:",
        error
      );
    }
  });
  return records;
}

async function migrateNonCalculable(records: Array<object>) {
  console.log(">>> updating data.indicateurX.nonCalculable");

  records.map((record: any) => {
    try {
      const {
        effectifsIndicateurCalculable: indicateurUnCalculable,
      } = calculIndicateurUn(record.data);
      const {
        effectifsIndicateurCalculable: indicateurDeuxCalculable,
      } = calculIndicateurDeux(record.data);
      const {
        effectifsIndicateurCalculable: indicateurTroisCalculable,
      } = calculIndicateurTrois(record.data);
      const {
        effectifsIndicateurCalculable: indicateurDeuxTroisCalculable,
      } = calculIndicateurDeuxTrois(record.data);
      const {
        indicateurCalculable: indicateurQuatreCalculable,
      } = calculIndicateurQuatre(record.data);
      record.data = {
        ...record.data,
        indicateurUn: {
          ...record.data.indicateurUn,
          nonCalculable: !indicateurUnCalculable,
        },
        indicateurDeux: {
          ...record.data.indicateurDeux,
          nonCalculable: !indicateurDeuxCalculable,
        },
        indicateurTrois: {
          ...record.data.indicateurTrois,
          nonCalculable: !indicateurTroisCalculable,
        },
        indicateurDeuxTrois: {
          ...record.data.indicateurDeuxTrois,
          nonCalculable: !indicateurDeuxTroisCalculable,
        },
        indicateurQuatre: {
          ...record.data.indicateurQuatre,
          nonCalculable: !indicateurQuatreCalculable,
        },
      };
    } catch (error) {
      console.log(
        "error while processing record",
        record.id,
        ". Error:",
        error
      );
    }
  });
  return records;
}

migrate();
