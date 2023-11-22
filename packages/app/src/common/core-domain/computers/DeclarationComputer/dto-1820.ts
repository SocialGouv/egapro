export const dto1820 = {
  "declaration-existante": { status: "creation" },
  entreprise: {
    type: "entreprise",
    tranche: "251:999",
    entrepriseDéclarante: {
      adresse: "105 RTE DE PARTHENAY 79100 SAINT-JEAN-DE-THOUARS",
      codeNaf: "82.92Z",
      codePostal: "79100",
      raisonSociale: "SOCOPLAN",
      siren: "627020373",
      commune: "SAINT-JEAN-DE-THOUARS",
      département: "79",
      région: "75",
    },
  },
  commencer: { annéeIndicateurs: 2022, siren: "627020373" },
  declarant: {
    accordRgpd: true,
    email: "demo@travail.fr",
    nom: "coll",
    prénom: "laet",
    téléphone: "0677614636",
  },
  "periode-reference": {
    périodeSuffisante: "oui",
    finPériodeRéférence: "2022-12-31",
    effectifTotal: 273,
  },
  remunerations: {
    estCalculable: "oui",
    mode: "niveau_branche",
    cse: "oui",
    dateConsultationCSE: "2023-02-22",
  },
  "remunerations-coefficient-branche": {
    catégories: [
      {
        nom: "",
        tranches: { ":29": 0.5, "30:39": 4, "40:49": 1.6, "50:": 2 },
      },
      {
        nom: "",
        tranches: { ":29": -0.8, "30:39": 5, "40:49": 2.6, "50:": 4.3 },
      },
      {
        nom: "",
        tranches: { ":29": "", "30:39": 10.5, "40:49": "", "50:": 8.6 },
      },
      {
        nom: "",
        tranches: { ":29": "", "30:39": "", "40:49": -55.6, "50:": -8.8 },
      },
    ],
  },
  "remunerations-resultat": {
    note: 37,
    populationFavorable: "femmes",
    résultat: 2.4,
  },
  augmentations: {
    estCalculable: "oui",
    populationFavorable: "hommes",
    résultat: 1.4,
    note: 20,
    catégories: { ouv: 0, emp: 1.4, tam: "", ic: "" },
  },
  promotions: {
    estCalculable: "oui",
    populationFavorable: "femmes",
    résultat: 4.7,
    note: 10,
    catégories: { ouv: 1.3, emp: -5.9, tam: "", ic: "" },
  },
  "conges-maternite": {
    estCalculable: "oui",
    résultat: 100,
    note: 15,
  },
  "hautes-remunerations": { résultat: 5, note: 10 },
};
