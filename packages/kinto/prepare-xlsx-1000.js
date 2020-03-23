const fs = require("fs");
const { convertArrayToCSV } = require("convert-array-to-csv");
const xlsx = require("xlsx");

// Remplacer le dump par le dump filtré
const dump = require(process.env.JSON_DUMP_FILENAME);

const filter = data =>
  data.data.informations.trancheEffectifs === "1000 et plus" ||
  (data.data.informations.anneeDeclaration === 2018 &&
    data.data.informations.trancheEffectifs === "Plus de 250" &&
    data.data.effectif.nombreSalariesTotal > 1000);

const filteredDump = dump.filter(filter);

const formatUESList = informationsEntreprise => {
  if (!informationsEntreprise.entreprisesUES) {
    return "";
  }
  return (
    informationsEntreprise.entreprisesUES
      .map(({ nom, siren }) => `${nom} (${siren})`)
      .join(", ") || ""
  );
};

const header = [
  "Raison Sociale",
  "SIREN",
  "Année",
  "Note",
  "Structure",
  "Nom UES",
  "Entreprises UES (SIREN)",
  "Région",
  "Département"
];

const lines = filteredDump.map(({ data }) => {
  return [
    data.informationsEntreprise.nomEntreprise,
    data.informationsEntreprise.siren,
    data.informations.anneeDeclaration,
    data.declaration.noteIndex ? data.declaration.noteIndex : "NC",
    data.informationsEntreprise.structure,
    data.informationsEntreprise.nomUES,
    formatUESList(data.informationsEntreprise),
    data.informationsEntreprise.region,
    data.informationsEntreprise.departement
  ];
});

const csv = convertArrayToCSV(lines, { header });

fs.writeFileSync("/tmp/dump_declarations_records_1000.csv", csv);

const workSheet = xlsx.utils.aoa_to_sheet([header].concat(lines));

const workBook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workBook, workSheet);

xlsx.writeFile(workBook, "/tmp/dump_declarations_records_1000.xlsx");
