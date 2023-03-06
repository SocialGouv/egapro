import { AppState } from "../globals"

export const simulationWithNoPeriodeSuffisante: { id: string; data: AppState } = {
  id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
  data: {
    informations: {
      formValidated: "Valid",
      nomEntreprise: "test",
      trancheEffectifs: "50 à 250",
      anneeDeclaration: 2021,
      periodeSuffisante: false,
    },
    effectif: {
      formValidated: "None",
      nombreSalaries: [
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 0,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 1,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 2,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 3,
        },
      ],
      nombreSalariesTotal: 0,
    },
    indicateurUn: {
      formValidated: "None",
      modaliteCalcul: "csp",
      remunerationAnnuelle: [
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 0,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 1,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 2,
        },
        {
          tranchesAges: [{ trancheAge: 0 }, { trancheAge: 1 }, { trancheAge: 2 }, { trancheAge: 3 }],
          categorieSocioPro: 3,
        },
      ],
      coefficientGroupFormValidated: "None",
      coefficientEffectifFormValidated: "None",
      coefficient: [],
      nonCalculable: true,
      motifNonCalculable: "egvi40pcet",
    },
    indicateurDeux: {
      formValidated: "None",
      presenceAugmentation: true,
      tauxAugmentation: [
        { categorieSocioPro: 0 },
        { categorieSocioPro: 1 },
        { categorieSocioPro: 2 },
        { categorieSocioPro: 3 },
      ],
      nonCalculable: true,
      motifNonCalculable: "egvi40pcet",
      mesuresCorrection: false,
    },
    indicateurTrois: {
      formValidated: "None",
      presencePromotion: true,
      tauxPromotion: [
        { categorieSocioPro: 0 },
        { categorieSocioPro: 1 },
        { categorieSocioPro: 2 },
        { categorieSocioPro: 3 },
      ],
      nonCalculable: true,
      motifNonCalculable: "egvi40pcet",
      mesuresCorrection: false,
    },
    indicateurDeuxTrois: {
      formValidated: "None",
      presenceAugmentationPromotion: true,
      periodeDeclaration: "unePeriodeReference",
      nonCalculable: true,
      motifNonCalculable: "etsno5f5h",
      mesuresCorrection: false,
    },
    indicateurQuatre: { formValidated: "None", presenceCongeMat: true, nonCalculable: true, motifNonCalculable: "" },
    indicateurCinq: { formValidated: "None" },
    informationsEntreprise: {
      formValidated: "Valid",
      nomEntreprise: "K & N BOULANGERIE ET PATISSERIE",
      siren: "825397516",
      codeNaf: "10.71C - Boulangerie et boulangerie-pâtisserie",
      region: "Nouvelle-Aquitaine",
      departement: "Charente-Maritime",
      adresse: "91 CRS DE L'EUROPE",
      codePostal: "17200",
      codePays: "",
      commune: "ROYAN",
      structure: "Entreprise",
      nomUES: "",
      entreprisesUES: [],
    },
    informationsDeclarant: {
      formValidated: "Valid",
      nom: "Macintosh",
      prenom: "Jake",
      tel: "0202020202",
      email: "admin@gmail.com",
      acceptationCGU: true,
    },
    declaration: {
      formValidated: "Valid",
      mesuresCorrection: "",
      dateConsultationCSE: "",
      datePublication: "",
      lienPublication: "",
      planRelance: false,
      modalitesPublication: "",
      dateDeclaration: "28/07/2022 12:38",
      totalPoint: 0,
      totalPointCalculable: 0,
    },
  },
}

export const expectedDeclarationWithNoPeriodeSuffisante = {
  id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
  source: "simulateur",
  déclaration: { année_indicateurs: 2021, période_suffisante: false },
  déclarant: { prénom: "Jake", nom: "Macintosh", téléphone: "0202020202", email: "admin@gmail.com" },
  entreprise: {
    raison_sociale: "K & N BOULANGERIE ET PATISSERIE",
    siren: "825397516",
    région: "75",
    département: "17",
    adresse: "91 CRS DE L'EUROPE",
    commune: "ROYAN",
    code_postal: "17200",
    code_naf: "10.71C",
    effectif: { tranche: "50:250" },
  },
}
