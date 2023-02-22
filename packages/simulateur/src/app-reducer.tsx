import deepmerge from "deepmerge"

import type { ActionType, AppState, PeriodeDeclaration } from "./globals"

import { CSP, TrancheAge } from "./globals"
import calculerIndicateurDeux from "./utils/calculsEgaProIndicateurDeux"
import calculerIndicateurDeuxTrois from "./utils/calculsEgaProIndicateurDeuxTrois"
import calculerIndicateurTrois from "./utils/calculsEgaProIndicateurTrois"
import calculerIndicateurUn from "./utils/calculsEgaProIndicateurUn"
import { datetimeToFrString } from "./utils/date"
import { isFormValid } from "./utils/formHelpers"
import mapEnum from "./utils/mapEnum"
import { combineMerge, overwriteMerge } from "./utils/merge"

const dataEffectif = mapEnum(CSP, (categorieSocioPro: CSP) => ({
  categorieSocioPro,
  tranchesAges: mapEnum(TrancheAge, (trancheAge: TrancheAge) => ({
    trancheAge,
    nombreSalariesFemmes: undefined,
    nombreSalariesHommes: undefined,
  })),
}))

const dataIndicateurUnCsp = mapEnum(CSP, (categorieSocioPro: CSP) => ({
  categorieSocioPro,
  tranchesAges: mapEnum(TrancheAge, (trancheAge: TrancheAge) => ({
    trancheAge,
    remunerationAnnuelleBrutFemmes: undefined,
    remunerationAnnuelleBrutHommes: undefined,
    ecartTauxRemuneration: undefined,
  })),
}))

export const dataIndicateurUnCoefGroup = {
  name: "",
  tranchesAges: mapEnum(TrancheAge, (trancheAge: TrancheAge) => ({
    trancheAge,
    nombreSalariesFemmes: undefined,
    nombreSalariesHommes: undefined,
    remunerationAnnuelleBrutFemmes: undefined,
    remunerationAnnuelleBrutHommes: undefined,
    ecartTauxRemuneration: undefined,
  })),
}

const dataIndicateurDeux = mapEnum(CSP, (categorieSocioPro: CSP) => ({
  categorieSocioPro,
  tauxAugmentationFemmes: undefined,
  tauxAugmentationHommes: undefined,
  ecartTauxAugmentation: undefined,
}))

const dataIndicateurTrois = mapEnum(CSP, (categorieSocioPro: CSP) => ({
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
    modaliteCalcul: "csp",
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
            isFormValid(state.effectif) ? { ...state.effectif, formValidated: "Invalid" } : state.effectif,
          indicateurUn: isFormValid(state.indicateurUn)
            ? { ...state.indicateurUn, formValidated: "Invalid" }
            : state.indicateurUn,
          indicateurDeux: isFormValid(state.indicateurDeux)
            ? { ...state.indicateurDeux, formValidated: "Invalid" }
            : state.indicateurDeux,
          indicateurTrois: isFormValid(state.indicateurTrois)
            ? { ...state.indicateurTrois, formValidated: "Invalid" }
            : state.indicateurTrois,
          indicateurDeuxTrois: isFormValid(state.indicateurDeuxTrois)
            ? { ...state.indicateurDeuxTrois, formValidated: "Invalid" }
            : state.indicateurDeuxTrois,
          indicateurQuatre: isFormValid(state.indicateurQuatre)
            ? { ...state.indicateurQuatre, formValidated: "Invalid" }
            : state.indicateurQuatre,
          indicateurCinq: isFormValid(state.indicateurCinq)
            ? { ...state.indicateurCinq, formValidated: "Invalid" }
            : state.indicateurCinq,
          informationsEntreprise: isFormValid(state.informationsEntreprise)
            ? { ...state.informationsEntreprise, formValidated: "Invalid" }
            : state.informationsEntreprise,
          informationsDeclarant: isFormValid(state.informationsDeclarant)
            ? { ...state.informationsDeclarant, formValidated: "Invalid" }
            : state.informationsDeclarant,
          declaration: isFormValid(state.declaration)
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
        }
      } else if (action.valid === "Valid") {
        /* Recalcul sur les indicateurs dépendants des effectifs.

        Logique:
        Pour le calculsIndicateurX
          => si non calculable, on reset l'indicateurX + formValidated = "Valid", c'est à dire qu'il devient OK et la coche doit être verte.
          => si calculable
            => si state.indicateurX.formValidated === "Valid" => formValidated = "Invalid"
            => sinon (donc Invalid ou None) copier tel quel
        */

        const newIndicateurUn = state.indicateurUn
        let newIndicateurDeux = state.indicateurDeux
        let newIndicateurTrois = state.indicateurTrois
        let newIndicateurDeuxTrois = state.indicateurDeuxTrois

        if (newIndicateurUn.formValidated === "Valid") {
          // For this indicator, we let the previous data and we just set the formValidated to "Invalid" to force user to confirm its data.
          // The reason is that indicator 1 has a mini wizard in it with coefficient.
          newIndicateurUn.formValidated = "Invalid"
          newIndicateurUn.coefficientEffectifFormValidated = "Invalid"
        } // else we let the state unchanged

        if (!calculerIndicateurDeux(state).effectifsIndicateurCalculable) {
          newIndicateurDeux = defaultState.indicateurDeux
          newIndicateurDeux.formValidated = "Valid"
        } else if (newIndicateurDeux.formValidated === "Valid") {
          newIndicateurDeux.formValidated = "Invalid"
        } // else we let the state unchanged

        if (!calculerIndicateurTrois(state).effectifsIndicateurCalculable) {
          newIndicateurTrois = defaultState.indicateurTrois
          newIndicateurTrois.formValidated = "Valid"
        } else if (newIndicateurTrois.formValidated === "Valid") {
          newIndicateurTrois.formValidated = "Invalid"
        } // else we let the state unchanged

        if (!calculerIndicateurDeuxTrois(state).effectifsIndicateurCalculable) {
          newIndicateurDeuxTrois = defaultState.indicateurDeuxTrois
          newIndicateurDeuxTrois.formValidated = "Valid"
        } else if (newIndicateurDeuxTrois.formValidated === "Valid") {
          newIndicateurDeuxTrois.formValidated = "Invalid"
        } // else we let the state unchanged

        return {
          ...state,
          effectif: { ...state.effectif, formValidated: action.valid },
          // Si les nouveaux effectifs, rendent non calculables les indicateurs 2, 3 ou 2&3, alors on les met à Valid.
          indicateurUn: newIndicateurUn,
          indicateurDeux: newIndicateurDeux,
          indicateurTrois: newIndicateurTrois,
          indicateurDeuxTrois: newIndicateurDeuxTrois,
        }
      }
      return {
        ...state,
        effectif: { ...state.effectif, formValidated: action.valid },
      }
    }
    case "updateIndicateurUnType": {
      const { modaliteCalcul } = action.data
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, modaliteCalcul },
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
            action.valid === "None" && isFormValid(state.indicateurUn) ? "Invalid" : state.indicateurUn.formValidated,
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
            action.valid === "None" && isFormValid(state.indicateurUn) ? "Invalid" : state.indicateurUn.formValidated,
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
      const dateDeclaration = datetimeToFrString(new Date())
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
