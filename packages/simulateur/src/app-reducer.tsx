import deepmerge from "deepmerge"
import { format } from "date-fns"

import type { AppState, ActionType, PeriodeDeclaration } from "./globals"

import { CategorieSocioPro, TranchesAges } from "./globals"
import mapEnum from "./utils/mapEnum"
import { overwriteMerge, combineMerge } from "./utils/merge"

const dataEffectif = mapEnum(CategorieSocioPro, (categorieSocioPro: CategorieSocioPro) => ({
  categorieSocioPro,
  tranchesAges: mapEnum(TranchesAges, (trancheAge: TranchesAges) => ({
    trancheAge,
    nombreSalariesFemmes: undefined,
    nombreSalariesHommes: undefined,
  })),
}))

const dataIndicateurUnCsp = mapEnum(CategorieSocioPro, (categorieSocioPro: CategorieSocioPro) => ({
  categorieSocioPro,
  tranchesAges: mapEnum(TranchesAges, (trancheAge: TranchesAges) => ({
    trancheAge,
    remunerationAnnuelleBrutFemmes: undefined,
    remunerationAnnuelleBrutHommes: undefined,
    ecartTauxRemuneration: undefined,
  })),
}))

export const dataIndicateurUnCoefGroup = {
  name: "",
  tranchesAges: mapEnum(TranchesAges, (trancheAge: TranchesAges) => ({
    trancheAge,
    nombreSalariesFemmes: undefined,
    nombreSalariesHommes: undefined,
    remunerationAnnuelleBrutFemmes: undefined,
    remunerationAnnuelleBrutHommes: undefined,
    ecartTauxRemuneration: undefined,
  })),
}

const dataIndicateurDeux = mapEnum(CategorieSocioPro, (categorieSocioPro: CategorieSocioPro) => ({
  categorieSocioPro,
  tauxAugmentationFemmes: undefined,
  tauxAugmentationHommes: undefined,
  ecartTauxAugmentation: undefined,
}))

const dataIndicateurTrois = mapEnum(CategorieSocioPro, (categorieSocioPro: CategorieSocioPro) => ({
  categorieSocioPro,
  tauxPromotionFemmes: undefined,
  tauxPromotionHommes: undefined,
  ecartTauxPromotion: undefined,
}))

const defaultState: AppState = {
  informations: {
    formValidated: "None",
    nomEntreprise: "",
    trancheEffectifs: "50 à 250",
    anneeDeclaration: undefined,
    finPeriodeReference: "",
    periodeSuffisante: undefined,
  },
  effectif: {
    formValidated: "None",
    nombreSalaries: dataEffectif,
  },
  indicateurUn: {
    formValidated: "None",
    csp: true,
    coef: false,
    autre: false,
    remunerationAnnuelle: dataIndicateurUnCsp,
    coefficientGroupFormValidated: "None",
    coefficientEffectifFormValidated: "None",
    coefficient: [],
  },
  indicateurDeux: {
    formValidated: "None",
    presenceAugmentation: true,
    tauxAugmentation: dataIndicateurDeux,
  },
  indicateurTrois: {
    formValidated: "None",
    presencePromotion: true,
    tauxPromotion: dataIndicateurTrois,
  },
  indicateurDeuxTrois: {
    formValidated: "None",
    presenceAugmentationPromotion: true,
    nombreAugmentationPromotionFemmes: undefined,
    nombreAugmentationPromotionHommes: undefined,
    periodeDeclaration: "unePeriodeReference" as PeriodeDeclaration,
  },
  indicateurQuatre: {
    formValidated: "None",
    presenceCongeMat: true,
    nombreSalarieesPeriodeAugmentation: undefined,
    nombreSalarieesAugmentees: undefined,
  },
  indicateurCinq: {
    formValidated: "None",
    nombreSalariesHommes: undefined,
    nombreSalariesFemmes: undefined,
  },
  informationsEntreprise: {
    formValidated: "None",
    nomEntreprise: "",
    siren: "",
    codeNaf: "",
    region: "",
    departement: "",
    adresse: "",
    codePostal: "",
    codePays: "",
    commune: "",
    structure: "Entreprise",
    nomUES: "",
    nombreEntreprises: undefined,
    entreprisesUES: [],
  },
  informationsDeclarant: {
    formValidated: "None",
    nom: "",
    prenom: "",
    tel: "",
    email: "",
    acceptationCGU: false,
  },
  declaration: {
    formValidated: "None",
    mesuresCorrection: "",
    cseMisEnPlace: undefined,
    dateConsultationCSE: "",
    publicationSurSiteInternet: undefined,
    datePublication: "",
    lienPublication: "",
    planRelance: undefined,
    modalitesPublication: "",
    dateDeclaration: "",
    noteIndex: undefined,
    totalPoint: 0,
    totalPointCalculable: 0,
  },
}

function appReducer(state: AppState | undefined, action: ActionType): AppState | undefined {
  if (action.type === "resetState") {
    return undefined
  }
  if (action.type === "initiateState") {
    return deepmerge(defaultState, action.data, {
      arrayMerge: overwriteMerge,
    })
  }
  if (!state) {
    return state
  }
  switch (action.type) {
    case "updateInformationsSimulation": {
      const { nomEntreprise, trancheEffectifs, anneeDeclaration, finPeriodeReference, periodeSuffisante } = action.data
      if (trancheEffectifs !== state.informations.trancheEffectifs) {
        return {
          ...state,
          informations: {
            ...state.informations,
            nomEntreprise,
            anneeDeclaration,
            trancheEffectifs,
            finPeriodeReference,
            periodeSuffisante,
          },
          effectif:
            // We set invalid for all forms because we want the user to revalidate the form because prerequisites may have changed.
            state.effectif.formValidated === "Valid" ? { ...state.effectif, formValidated: "Invalid" } : state.effectif,
          indicateurUn:
            state.indicateurUn.formValidated === "Valid"
              ? { ...state.indicateurUn, formValidated: "Invalid" }
              : state.indicateurUn,
          indicateurDeux:
            state.indicateurDeux.formValidated === "Valid"
              ? { ...state.indicateurDeux, formValidated: "Invalid" }
              : state.indicateurDeux,
          indicateurTrois:
            state.indicateurTrois.formValidated === "Valid"
              ? { ...state.indicateurTrois, formValidated: "Invalid" }
              : state.indicateurTrois,
          indicateurDeuxTrois:
            state.indicateurDeuxTrois.formValidated === "Valid"
              ? { ...state.indicateurDeuxTrois, formValidated: "Invalid" }
              : state.indicateurDeuxTrois,
          indicateurQuatre:
            state.indicateurQuatre.formValidated === "Valid"
              ? { ...state.indicateurQuatre, formValidated: "Invalid" }
              : state.indicateurQuatre,
          indicateurCinq:
            state.indicateurCinq.formValidated === "Valid"
              ? { ...state.indicateurCinq, formValidated: "Invalid" }
              : state.indicateurCinq,
          informationsEntreprise:
            state.informationsEntreprise.formValidated === "Valid"
              ? { ...state.informationsEntreprise, formValidated: "Invalid" }
              : state.informationsEntreprise,
          informationsDeclarant:
            state.informationsDeclarant.formValidated === "Valid"
              ? { ...state.informationsDeclarant, formValidated: "Invalid" }
              : state.informationsDeclarant,
          declaration:
            state.declaration.formValidated === "Valid"
              ? {
                  ...state.declaration,
                  formValidated: "Invalid",
                }
              : state.declaration,
        }
      }

      // If year >= 2021, use the planRelance if present, for other cases, always return undefined.
      let planRelance = undefined

      if (state.informations.anneeDeclaration && state.informations.anneeDeclaration >= 2021) {
        planRelance = state.declaration.planRelance
      }

      return {
        ...state,
        informations: {
          ...state.informations,
          nomEntreprise,
          trancheEffectifs,
          anneeDeclaration,
          finPeriodeReference,
          periodeSuffisante,
        },
        declaration: {
          ...state.declaration,
          planRelance,
        },
      }
    }
    case "validateInformationsSimulation": {
      return {
        ...state,
        informations: {
          ...state.informations,
          formValidated: action.valid,
        },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "updateEffectif": {
      const { nombreSalaries } = action.data
      return {
        ...state,
        effectif: { ...state.effectif, nombreSalaries },
      }
    }
    case "validateEffectif": {
      if (action.valid === "None") {
        return {
          ...state,
          effectif: { ...state.effectif, formValidated: "None" },
          indicateurUn:
            state.indicateurUn.formValidated === "Valid"
              ? {
                  ...state.indicateurUn,
                  formValidated: "Invalid",
                  coefficientEffectifFormValidated: "Invalid",
                }
              : state.indicateurUn,
          indicateurDeux:
            state.indicateurDeux.formValidated === "Valid"
              ? { ...state.indicateurDeux, formValidated: "Invalid" }
              : state.indicateurDeux,
          indicateurTrois:
            state.indicateurTrois.formValidated === "Valid"
              ? { ...state.indicateurTrois, formValidated: "Invalid" }
              : state.indicateurTrois,
          indicateurDeuxTrois:
            state.indicateurDeuxTrois.formValidated === "Valid"
              ? { ...state.indicateurDeuxTrois, formValidated: "Invalid" }
              : state.indicateurDeuxTrois,
          declaration:
            state.declaration.formValidated === "Valid"
              ? { ...state.declaration, formValidated: "Invalid" }
              : state.declaration,
        }
      }
      return {
        ...state,
        effectif: { ...state.effectif, formValidated: action.valid },
      }
    }
    case "updateIndicateurUnType": {
      const { csp, coef, autre } = action.data
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, csp, coef, autre },
      }
    }
    case "updateIndicateurUnCsp": {
      const { remunerationAnnuelle } = action.data
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, remunerationAnnuelle },
      }
    }
    case "updateIndicateurUnCoefAddGroup": {
      const newGroupCoef = { ...dataIndicateurUnCoefGroup } // Clone to avoid mutable issues
      const coefficient = [...state.indicateurUn.coefficient, newGroupCoef]
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, coefficient },
      }
    }
    case "updateIndicateurUnCoefDeleteGroup": {
      const coefficient = [
        ...state.indicateurUn.coefficient.slice(0, action.index),
        ...state.indicateurUn.coefficient.slice(action.index + 1, state.indicateurUn.coefficient.length),
      ]
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, coefficient },
      }
    }
    case "updateIndicateurUnCoef": {
      const { coefficient } = action.data

      const mergedCoefficient = deepmerge(
        state.indicateurUn.coefficient,
        // @ts-ignore
        coefficient,
        { arrayMerge: combineMerge },
      )
      return {
        ...state,
        // @ts-ignore
        indicateurUn: { ...state.indicateurUn, coefficient: mergedCoefficient },
      }
    }
    case "validateIndicateurUnCoefGroup": {
      return {
        ...state,
        indicateurUn: {
          ...state.indicateurUn,
          coefficientGroupFormValidated: action.valid,
          coefficientEffectifFormValidated:
            action.valid === "None" && state.indicateurUn.coefficientEffectifFormValidated === "Valid"
              ? "Invalid"
              : state.indicateurUn.coefficientEffectifFormValidated,
          formValidated:
            action.valid === "None" && state.indicateurUn.formValidated === "Valid"
              ? "Invalid"
              : state.indicateurUn.formValidated,
        },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "validateIndicateurUnCoefEffectif": {
      return {
        ...state,
        indicateurUn: {
          ...state.indicateurUn,
          coefficientEffectifFormValidated: action.valid,
          formValidated:
            action.valid === "None" && state.indicateurUn.formValidated === "Valid"
              ? "Invalid"
              : state.indicateurUn.formValidated,
        },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "validateIndicateurUn": {
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, formValidated: action.valid },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "updateIndicateurDeux": {
      const { tauxAugmentation, presenceAugmentation } = action.data
      return {
        ...state,
        indicateurDeux: {
          ...state.indicateurDeux,
          presenceAugmentation,
          tauxAugmentation,
        },
      }
    }
    case "validateIndicateurDeux": {
      return {
        ...state,
        indicateurDeux: {
          ...state.indicateurDeux,
          formValidated: action.valid,
        },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "updateIndicateurTrois": {
      const { tauxPromotion, presencePromotion } = action.data
      return {
        ...state,
        indicateurTrois: {
          ...state.indicateurTrois,
          presencePromotion,
          tauxPromotion,
        },
      }
    }
    case "validateIndicateurTrois": {
      return {
        ...state,
        indicateurTrois: {
          ...state.indicateurTrois,
          formValidated: action.valid,
        },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "updateIndicateurDeuxTrois": {
      const {
        presenceAugmentationPromotion,
        nombreAugmentationPromotionFemmes,
        nombreAugmentationPromotionHommes,
        periodeDeclaration,
      } = action.data
      return {
        ...state,
        indicateurDeuxTrois: {
          ...state.indicateurDeuxTrois,
          presenceAugmentationPromotion,
          nombreAugmentationPromotionFemmes,
          nombreAugmentationPromotionHommes,
          periodeDeclaration,
        },
      }
    }
    case "validateIndicateurDeuxTrois": {
      return {
        ...state,
        indicateurDeuxTrois: {
          ...state.indicateurDeuxTrois,
          formValidated: action.valid,
        },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "updateIndicateurQuatre": {
      return {
        ...state,
        indicateurQuatre: {
          ...state.indicateurQuatre,
          ...action.data,
        },
      }
    }
    case "validateIndicateurQuatre": {
      return {
        ...state,
        indicateurQuatre: {
          ...state.indicateurQuatre,
          formValidated: action.valid,
        },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "updateIndicateurCinq": {
      return {
        ...state,
        indicateurCinq: {
          ...state.indicateurCinq,
          ...action.data,
        },
      }
    }
    case "validateIndicateurCinq": {
      return {
        ...state,
        indicateurCinq: {
          ...state.indicateurCinq,
          formValidated: action.valid,
        },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "updateInformationsEntreprise": {
      return {
        ...state,
        informationsEntreprise: {
          ...state.informationsEntreprise,
          ...action.data,
        },
      }
    }
    case "validateInformationsEntreprise": {
      return {
        ...state,
        informationsEntreprise: {
          ...state.informationsEntreprise,
          formValidated: action.valid,
        },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "updateInformationsDeclarant": {
      return {
        ...state,
        informationsDeclarant: {
          ...state.informationsDeclarant,
          ...action.data,
        },
      }
    }
    case "validateInformationsDeclarant": {
      return {
        ...state,
        informationsDeclarant: {
          ...state.informationsDeclarant,
          formValidated: action.valid,
        },
        declaration: {
          ...state.declaration,
          formValidated: action.valid === "None" ? "Invalid" : state.declaration.formValidated,
        },
      }
    }
    case "updateDeclaration": {
      return {
        ...state,
        declaration: {
          ...state.declaration,
          ...action.data,
        },
      }
    }
    case "validateDeclaration": {
      const dateDeclaration = format(new Date(), "dd/MM/yyyy HH:mm")
      return {
        ...state,
        effectif:
          action.valid === "Valid"
            ? {
                ...state.effectif,
                ...action.effectifData,
              }
            : state.effectif,
        indicateurUn:
          action.valid === "Valid"
            ? {
                ...state.indicateurUn,
                ...action.indicateurUnData,
              }
            : state.indicateurUn,
        indicateurDeux:
          action.valid === "Valid"
            ? {
                ...state.indicateurDeux,
                ...action.indicateurDeuxData,
              }
            : state.indicateurDeux,
        indicateurTrois:
          action.valid === "Valid"
            ? {
                ...state.indicateurTrois,
                ...action.indicateurTroisData,
              }
            : state.indicateurTrois,
        indicateurDeuxTrois:
          action.valid === "Valid"
            ? {
                ...state.indicateurDeuxTrois,
                ...action.indicateurDeuxTroisData,
              }
            : state.indicateurDeuxTrois,
        indicateurQuatre:
          action.valid === "Valid"
            ? {
                ...state.indicateurQuatre,
                ...action.indicateurQuatreData,
              }
            : state.indicateurQuatre,
        indicateurCinq:
          action.valid === "Valid"
            ? {
                ...state.indicateurCinq,
                ...action.indicateurCinqData,
              }
            : state.indicateurCinq,
        declaration: {
          ...state.declaration,
          dateDeclaration:
            // Automatically set the "dateDeclaration" to now.
            action.valid === "Valid" ? dateDeclaration : state.declaration.dateDeclaration,
          noteIndex: action.valid === "Valid" ? action.noteIndex : state.declaration.noteIndex,
          totalPoint: action.valid === "Valid" ? action.totalPoint : state.declaration.totalPoint,
          totalPointCalculable:
            action.valid === "Valid" ? action.totalPointCalculable : state.declaration.totalPointCalculable,
          formValidated: action.valid,
        },
      }
    }
    case "updateEmailDeclarant": {
      return {
        ...state,
        informationsDeclarant: {
          ...state.informationsDeclarant,
          ...action.data,
        },
      }
    }
    default:
      return state
  }
}

export const currifiedReducer = (action: ActionType) => (state: AppState | undefined) => appReducer(state, action)

export default appReducer
