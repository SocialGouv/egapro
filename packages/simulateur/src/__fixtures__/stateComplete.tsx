import flow from "lodash/fp/flow"

import { CSP, TrancheAge, ActionType } from "../globals"
import { currifiedReducer as reducer } from "../app-reducer"

const actionInitiateState: ActionType = {
  type: "initiateState",
  data: {},
}

const actionUpdateInformationsSimulation: ActionType = {
  type: "updateInformationsSimulation",
  data: {
    nomEntreprise: "BigCorp",
    trancheEffectifs: "1000 et plus",
    anneeDeclaration: 2020,
    finPeriodeReference: "2019-12-31",
    periodeSuffisante: true,
  },
}

const actionUpdateEffectif: ActionType = {
  type: "updateEffectif",
  data: {
    nombreSalaries: [
      {
        categorieSocioPro: CSP.Ouvriers,
        tranchesAges: [
          {
            trancheAge: TrancheAge.MoinsDe30ans,
            nombreSalariesFemmes: 23,
            nombreSalariesHommes: 32,
          },
          {
            trancheAge: TrancheAge.De30a39ans,
            nombreSalariesFemmes: 12,
            nombreSalariesHommes: 13,
          },
          {
            trancheAge: TrancheAge.De40a49ans,
            nombreSalariesFemmes: 34,
            nombreSalariesHommes: 7,
          },
          {
            trancheAge: TrancheAge.PlusDe50ans,
            nombreSalariesFemmes: 5,
            nombreSalariesHommes: 21,
          },
        ],
      },
      {
        categorieSocioPro: CSP.Employes,
        tranchesAges: [
          {
            trancheAge: TrancheAge.MoinsDe30ans,
            nombreSalariesFemmes: 63,
            nombreSalariesHommes: 25,
          },
          {
            trancheAge: TrancheAge.De30a39ans,
            nombreSalariesFemmes: 52,
            nombreSalariesHommes: 62,
          },
          {
            trancheAge: TrancheAge.De40a49ans,
            nombreSalariesFemmes: 16,
            nombreSalariesHommes: 18,
          },
          {
            trancheAge: TrancheAge.PlusDe50ans,
            nombreSalariesFemmes: 27,
            nombreSalariesHommes: 19,
          },
        ],
      },
      {
        categorieSocioPro: CSP.Techniciens,
        tranchesAges: [
          {
            trancheAge: TrancheAge.MoinsDe30ans,
            nombreSalariesFemmes: 14,
            nombreSalariesHommes: 15,
          },
          {
            trancheAge: TrancheAge.De30a39ans,
            nombreSalariesFemmes: 4,
            nombreSalariesHommes: 5,
          },
          {
            trancheAge: TrancheAge.De40a49ans,
            nombreSalariesFemmes: 6,
            nombreSalariesHommes: 8,
          },
          {
            trancheAge: TrancheAge.PlusDe50ans,
            nombreSalariesFemmes: 7,
            nombreSalariesHommes: 7,
          },
        ],
      },
      {
        categorieSocioPro: CSP.Cadres,
        tranchesAges: [
          {
            trancheAge: TrancheAge.MoinsDe30ans,
            nombreSalariesFemmes: 7,
            nombreSalariesHommes: 8,
          },
          {
            trancheAge: TrancheAge.De30a39ans,
            nombreSalariesFemmes: 10,
            nombreSalariesHommes: 8,
          },
          {
            trancheAge: TrancheAge.De40a49ans,
            nombreSalariesFemmes: 13,
            nombreSalariesHommes: 13,
          },
          {
            trancheAge: TrancheAge.PlusDe50ans,
            nombreSalariesFemmes: 16,
            nombreSalariesHommes: 19,
          },
        ],
      },
    ],
  },
}

const actionUpdateIndicateurUnCsp: ActionType = {
  type: "updateIndicateurUnCsp",
  data: {
    remunerationAnnuelle: [
      {
        categorieSocioPro: CSP.Ouvriers,
        tranchesAges: [
          {
            trancheAge: TrancheAge.MoinsDe30ans,
            remunerationAnnuelleBrutFemmes: 23000,
            remunerationAnnuelleBrutHommes: 25000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.De30a39ans,
            remunerationAnnuelleBrutFemmes: 24000,
            remunerationAnnuelleBrutHommes: 26000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.De40a49ans,
            remunerationAnnuelleBrutFemmes: 25500,
            remunerationAnnuelleBrutHommes: 26000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.PlusDe50ans,
            remunerationAnnuelleBrutFemmes: 27500,
            remunerationAnnuelleBrutHommes: 28000,
            ecartTauxRemuneration: undefined,
          },
        ],
      },
      {
        categorieSocioPro: CSP.Employes,
        tranchesAges: [
          {
            trancheAge: TrancheAge.MoinsDe30ans,
            remunerationAnnuelleBrutFemmes: 23000,
            remunerationAnnuelleBrutHommes: 25000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.De30a39ans,
            remunerationAnnuelleBrutFemmes: 24000,
            remunerationAnnuelleBrutHommes: 26000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.De40a49ans,
            remunerationAnnuelleBrutFemmes: 31000,
            remunerationAnnuelleBrutHommes: 33000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.PlusDe50ans,
            remunerationAnnuelleBrutFemmes: 39000,
            remunerationAnnuelleBrutHommes: 43000,
            ecartTauxRemuneration: undefined,
          },
        ],
      },
      {
        categorieSocioPro: CSP.Techniciens,
        tranchesAges: [
          {
            trancheAge: TrancheAge.MoinsDe30ans,
            remunerationAnnuelleBrutFemmes: 26000,
            remunerationAnnuelleBrutHommes: 28000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.De30a39ans,
            remunerationAnnuelleBrutFemmes: 27000,
            remunerationAnnuelleBrutHommes: 29000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.De40a49ans,
            remunerationAnnuelleBrutFemmes: 34000,
            remunerationAnnuelleBrutHommes: 36000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.PlusDe50ans,
            remunerationAnnuelleBrutFemmes: 42000,
            remunerationAnnuelleBrutHommes: 46000,
            ecartTauxRemuneration: undefined,
          },
        ],
      },
      {
        categorieSocioPro: CSP.Cadres,
        tranchesAges: [
          {
            trancheAge: TrancheAge.MoinsDe30ans,
            remunerationAnnuelleBrutFemmes: 36000,
            remunerationAnnuelleBrutHommes: 38000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.De30a39ans,
            remunerationAnnuelleBrutFemmes: 37000,
            remunerationAnnuelleBrutHommes: 39000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.De40a49ans,
            remunerationAnnuelleBrutFemmes: 44000,
            remunerationAnnuelleBrutHommes: 46000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.PlusDe50ans,
            remunerationAnnuelleBrutFemmes: 52000,
            remunerationAnnuelleBrutHommes: 56000,
            ecartTauxRemuneration: undefined,
          },
        ],
      },
    ],
  },
}

const actionUpdateIndicateurUnCoefName: ActionType = {
  type: "updateIndicateurUnCoef",
  data: {
    coefficient: [
      {
        name: "Business Developers",
      },
    ],
  },
}

const actionUpdateIndicateurUnCoefNombreSalaries: ActionType = {
  type: "updateIndicateurUnCoef",
  data: {
    coefficient: [
      {
        tranchesAges: [
          {
            trancheAge: TrancheAge.MoinsDe30ans,
            nombreSalariesFemmes: 5,
            nombreSalariesHommes: 4,
          },
          {
            trancheAge: TrancheAge.De30a39ans,
            nombreSalariesFemmes: 2,
            nombreSalariesHommes: 6,
          },
          {
            trancheAge: TrancheAge.De40a49ans,
            nombreSalariesFemmes: 5,
            nombreSalariesHommes: 3,
          },
          {
            trancheAge: TrancheAge.PlusDe50ans,
            nombreSalariesFemmes: 1,
            nombreSalariesHommes: 3,
          },
        ],
      },
    ],
  },
}

const actionUpdateIndicateurUnCoefRemuneration: ActionType = {
  type: "updateIndicateurUnCoef",
  data: {
    coefficient: [
      {
        tranchesAges: [
          {
            trancheAge: TrancheAge.MoinsDe30ans,
            remunerationAnnuelleBrutFemmes: 25000,
            remunerationAnnuelleBrutHommes: 24000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.De30a39ans,
            remunerationAnnuelleBrutFemmes: 32000,
            remunerationAnnuelleBrutHommes: 32000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.De40a49ans,
            remunerationAnnuelleBrutFemmes: 41000,
            remunerationAnnuelleBrutHommes: 43000,
            ecartTauxRemuneration: undefined,
          },
          {
            trancheAge: TrancheAge.PlusDe50ans,
            remunerationAnnuelleBrutFemmes: 49000,
            remunerationAnnuelleBrutHommes: 51500,
            ecartTauxRemuneration: undefined,
          },
        ],
      },
    ],
  },
}

const actionUpdateIndicateurDeux: ActionType = {
  type: "updateIndicateurDeux",
  data: {
    presenceAugmentation: false,
    tauxAugmentation: [
      {
        categorieSocioPro: CSP.Ouvriers,
        tauxAugmentationFemmes: 2.2,
        tauxAugmentationHommes: 3.5,
        ecartTauxAugmentation: undefined,
      },
      {
        categorieSocioPro: CSP.Employes,
        tauxAugmentationFemmes: 1.3,
        tauxAugmentationHommes: 2.2,
        ecartTauxAugmentation: undefined,
      },
      {
        categorieSocioPro: CSP.Techniciens,
        tauxAugmentationFemmes: 8.02,
        tauxAugmentationHommes: 6.92,
        ecartTauxAugmentation: undefined,
      },
      {
        categorieSocioPro: CSP.Cadres,
        tauxAugmentationFemmes: 12.15,
        tauxAugmentationHommes: 13.56,
        ecartTauxAugmentation: undefined,
      },
    ],
  },
}

const actionUpdateIndicateurTrois: ActionType = {
  type: "updateIndicateurTrois",
  data: {
    presencePromotion: false,
    tauxPromotion: [
      {
        categorieSocioPro: CSP.Ouvriers,
        tauxPromotionFemmes: 1.1,
        tauxPromotionHommes: 2.2,
        ecartTauxPromotion: undefined,
      },
      {
        categorieSocioPro: CSP.Employes,
        tauxPromotionFemmes: 0.3,
        tauxPromotionHommes: 2.0,
        ecartTauxPromotion: undefined,
      },
      {
        categorieSocioPro: CSP.Techniciens,
        tauxPromotionFemmes: 2,
        tauxPromotionHommes: 3,
        ecartTauxPromotion: undefined,
      },
      {
        categorieSocioPro: CSP.Cadres,
        tauxPromotionFemmes: 4,
        tauxPromotionHommes: 5.55,
        ecartTauxPromotion: undefined,
      },
    ],
  },
}

const actionUpdateIndicateurDeuxTrois: ActionType = {
  type: "updateIndicateurDeuxTrois",
  data: {
    presenceAugmentationPromotion: false,
    nombreAugmentationPromotionFemmes: 1,
    nombreAugmentationPromotionHommes: 2,
    periodeDeclaration: "unePeriodeReference",
  },
}

const actionUpdateIndicateurQuatre: ActionType = {
  type: "updateIndicateurQuatre",
  data: {
    presenceCongeMat: false,
    nombreSalarieesPeriodeAugmentation: 7,
    nombreSalarieesAugmentees: 7,
  },
}

const actionUpdateIndicateurCinq: ActionType = {
  type: "updateIndicateurCinq",
  data: {
    nombreSalariesHommes: 6,
    nombreSalariesFemmes: 4,
  },
}

const actionUpdateInformationsEntreprise: ActionType = {
  type: "updateInformationsEntreprise",
  data: {
    nomEntreprise: "acme",
    siren: "1234",
    codeNaf: "5678",
    region: "Auvergne-Rhône-Alpes",
    departement: "Drôme",
    adresse: "30 rue des alouettes",
    codePostal: "12345",
    codePays: "",
    commune: "Trifouilly",
    structure: "Unité Economique et Sociale (UES)",
    nomUES: "nom d'une UES",
    nombreEntreprises: 2,
    entreprisesUES: [
      { nom: "entreprise 1", siren: "12345" },
      { nom: "entreprise 2", siren: "67890" },
    ],
  },
}

const actionUpdateInformationsDeclarant: ActionType = {
  type: "updateInformationsDeclarant",
  data: {
    nom: "Daffy",
    prenom: "Duck",
    tel: "0123456789",
    email: "daffy.duck@example.com",
    acceptationCGU: true,
  },
}

const actionUpdateDeclaration: ActionType = {
  type: "updateDeclaration",
  data: {
    mesuresCorrection: "mmo",
    cseMisEnPlace: true,
    dateConsultationCSE: "01/02/2019",
    datePublication: "01/02/2020",
    publicationSurSiteInternet: true,
    lienPublication: "https://example.com",
    modalitesPublication: "",
    planRelance: undefined,
  },
}

const stateDefault = flow(
  reducer(actionInitiateState),
  reducer(actionUpdateInformationsSimulation),
  reducer(actionUpdateEffectif),
  reducer(actionUpdateIndicateurUnCsp),
  reducer(actionUpdateIndicateurUnCoefName),
  reducer(actionUpdateIndicateurUnCoefNombreSalaries),
  reducer(actionUpdateIndicateurUnCoefRemuneration),
  reducer(actionUpdateIndicateurDeux),
  reducer(actionUpdateIndicateurTrois),
  reducer(actionUpdateIndicateurDeuxTrois),
  reducer(actionUpdateIndicateurQuatre),
  reducer(actionUpdateIndicateurCinq),
  reducer(actionUpdateInformationsEntreprise),
  reducer(actionUpdateInformationsDeclarant),
  reducer(actionUpdateDeclaration),
)(undefined)

export default stateDefault
