import deepmerge from "deepmerge"

import type { ActionType, AppState, CoefficientGroupe, PeriodeDeclaration, RemunerationsPourCSP } from "./globals"

import { CSP, TrancheAge } from "./globals"
import calculerIndicateurDeux from "./utils/calculsEgaProIndicateurDeux"
import calculerIndicateurDeuxTrois from "./utils/calculsEgaProIndicateurDeuxTrois"
import calculerIndicateurTrois from "./utils/calculsEgaProIndicateurTrois"
import { datetimeToFrString } from "./utils/date"
import { isFormValid } from "./utils/formHelpers"
import mapEnum from "./utils/mapEnum"
import { combineMerge, overwriteMerge } from "./utils/merge"
import produce from "immer"
import calculerIndicateurUn, { calculerValiditeGroupe3 } from "./utils/calculsEgaProIndicateurUn"

const defaultDataEffectif = mapEnum(CSP, (categorieSocioPro: CSP) => ({
  categorieSocioPro,
  tranchesAges: mapEnum(TrancheAge, (trancheAge: TrancheAge) => ({
    trancheAge,
    nombreSalariesFemmes: undefined,
    nombreSalariesHommes: undefined,
  })),
}))

const defaultDataIndicateurUnCsp = mapEnum(
  CSP,
  (categorieSocioPro: CSP): RemunerationsPourCSP => ({
    categorieSocioPro,
    tranchesAges: mapEnum(TrancheAge, (trancheAge: TrancheAge) => ({
      trancheAge,
      remunerationAnnuelleBrutFemmes: undefined,
      remunerationAnnuelleBrutHommes: undefined,
      ecartTauxRemuneration: undefined,
    })),
  }),
)

export const defaultDataIndicateurUnCoefGroup: CoefficientGroupe = {
  nom: "",
  tranchesAges: mapEnum(TrancheAge, (trancheAge: TrancheAge) => ({
    trancheAge,
    nombreSalariesFemmes: undefined,
    nombreSalariesHommes: undefined,
    remunerationAnnuelleBrutFemmes: undefined,
    remunerationAnnuelleBrutHommes: undefined,
    ecartTauxRemuneration: undefined,
  })),
}

const defaultDataIndicateurDeux = mapEnum(CSP, (categorieSocioPro: CSP) => ({
  categorieSocioPro,
  tauxAugmentationFemmes: undefined,
  tauxAugmentationHommes: undefined,
  ecartTauxAugmentation: undefined,
}))

const defaultDataIndicateurTrois = mapEnum(CSP, (categorieSocioPro: CSP) => ({
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
    nombreSalaries: defaultDataEffectif,
  },
  indicateurUn: {
    formValidated: "None",
    modaliteCalcul: "csp",
    modaliteCalculformValidated: "None",
    remunerationsAnnuelles: defaultDataIndicateurUnCsp,
    coefficientGroupFormValidated: "None",
    coefficientEffectifFormValidated: "None",
    coefficientRemuFormValidated: "None",
    coefficients: [],
  },
  indicateurDeux: {
    formValidated: "None",
    presenceAugmentation: true,
    tauxAugmentation: defaultDataIndicateurDeux,
  },
  indicateurTrois: {
    formValidated: "None",
    presencePromotion: true,
    tauxPromotion: defaultDataIndicateurTrois,
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
    case "unsetEffectif": {
      return {
        ...state,
        effectif: { ...state.effectif, formValidated: "None" },
      }
    }
    case "setValidEffectif": {
      /* Recalcul sur les indicateurs dépendants des effectifs.

        Logique:
        Pour le calculsIndicateurX
          => si non calculable, on reset l'indicateurX + formValidated = "Valid", c'est à dire qu'il devient OK et la coche doit être verte.
          => si calculable
            => si state.indicateurX.formValidated === "Valid" => formValidated = "Invalid", pour indiquer qu'il faut revalider les données
            => sinon (donc Invalid ou None), laisser tel quel
        */

      return produce(state, (draft) => {
        draft.effectif.formValidated = "Valid"

        if (state.indicateurUn.modaliteCalcul === "csp") {
          if (!calculerIndicateurUn(state).effectifsIndicateurCalculable) {
            draft.indicateurUn = { ...defaultState.indicateurUn }
            draft.indicateurUn.formValidated = "Valid"
            draft.indicateurUn.modaliteCalculformValidated = "Valid"
          } else {
            draft.indicateurUn.formValidated = "None"
          }
        } else {
          // If effectifs in Effectif page changed, we need to force user to go to effectif coefficient tab for validation to be done.
          draft.indicateurUn.formValidated = "None"
          draft.indicateurUn.coefficientEffectifFormValidated = "None"
        } // else we let the state unchanged

        if (!calculerIndicateurDeux(state).effectifsIndicateurCalculable) {
          draft.indicateurDeux = { ...defaultState.indicateurDeux }
          draft.indicateurDeux.formValidated = "Valid"
        } else if (draft.indicateurDeux.formValidated === "Valid") {
          draft.indicateurDeux.formValidated = "Invalid"
        } // else we let the state unchanged

        if (!calculerIndicateurTrois(state).effectifsIndicateurCalculable) {
          draft.indicateurTrois = { ...defaultState.indicateurTrois }
          draft.indicateurTrois.formValidated = "Valid"
        } else if (draft.indicateurTrois.formValidated === "Valid") {
          draft.indicateurTrois.formValidated = "Invalid"
        } // else we let the state unchanged

        if (!calculerIndicateurDeuxTrois(state).effectifsIndicateurCalculable) {
          draft.indicateurDeuxTrois = { ...defaultState.indicateurDeuxTrois }
          draft.indicateurDeuxTrois.formValidated = "Valid"
        } else if (draft.indicateurDeuxTrois.formValidated === "Valid") {
          draft.indicateurDeuxTrois.formValidated = "Invalid"
        } // else we let the state unchanged
      })
    }
    case "setInvalidEffectif": {
      return {
        ...state,
        effectif: { ...state.effectif, formValidated: "Invalid" },
      }
    }
    case "updateIndicateurUnModaliteCalcul": {
      const { modaliteCalcul } = action.data
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, modaliteCalcul },
      }
    }
    case "updateIndicateurUnCsp": {
      const { remunerationsAnnuelles } = action.data
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, remunerationsAnnuelles },
      }
    }
    // TODO: devrait avoir un impact sur les champs effectifs et rémunérations
    case "updateIndicateurUnCoefAddGroup": {
      const newGroupCoef = { ...defaultDataIndicateurUnCoefGroup } // Clone to avoid mutable issues
      const coefficient = [...state.indicateurUn.coefficients, newGroupCoef]
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, coefficients: coefficient },
      }
    }
    // TODO: devrait avoir un impact sur les champs effectifs et rémunérations
    case "updateIndicateurUnCoefDeleteGroup": {
      const coefficient = [
        ...state.indicateurUn.coefficients.slice(0, action.index),
        ...state.indicateurUn.coefficients.slice(action.index + 1, state.indicateurUn.coefficients.length),
      ]
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, coefficients: coefficient },
      }
    }
    // Utilisé par l'onglet pour les groupes, pour les effectifs et pour les rémunérations...
    case "updateIndicateurUnCoef": {
      const { coefficients } = action.data

      const mergedCoefficient = deepmerge(
        state.indicateurUn.coefficients,
        // @ts-ignore
        coefficients,
        { arrayMerge: combineMerge },
      )
      return {
        ...state,
        // @ts-ignore
        indicateurUn: { ...state.indicateurUn, coefficients: mergedCoefficient },
      }
    }
    case "setValidIndicateurUnCSP": {
      return produce(state, (draft) => {
        draft.indicateurUn.formValidated = "Valid"
      })
    }
    case "setInvalidIndicateurUnCSP": {
      return produce(state, (draft) => {
        draft.indicateurUn.formValidated = "Invalid"
      })
    }
    case "unsetIndicateurUnCSP": {
      return produce(state, (draft) => {
        draft.indicateurUn.formValidated = "None"
        draft.declaration.formValidated = "Invalid"
      })
    }
    case "setValidIndicateurUnCoefGroup": {
      return produce(state, (draft) => {
        draft.indicateurUn.coefficientGroupFormValidated = "Valid"
        // When groups changed, we need to ensure to go to effectif and remu tabs for validation to be done.
        draft.indicateurUn.formValidated = "None"
        draft.indicateurUn.coefficientEffectifFormValidated = "None"
        draft.indicateurUn.coefficientRemuFormValidated = "None"
      })
    }
    case "setInvalidIndicateurUnCoefGroup": {
      return produce(state, (draft) => {
        draft.indicateurUn.coefficientGroupFormValidated = "Invalid"
        draft.indicateurUn.formValidated = "Invalid"
      })
    }
    case "unsetIndicateurUnCoefGroup": {
      return produce(state, (draft) => {
        draft.indicateurUn.coefficientGroupFormValidated = "None"
        draft.indicateurUn.formValidated = "None"
        draft.declaration.formValidated = "Invalid"
      })
    }
    case "setValidIndicateurUnCoefEffectif": {
      return produce(state, (draft) => {
        draft.indicateurUn.coefficientEffectifFormValidated = "Valid"
        // When effectifs changed, we need to ensure to go to remu tab for validation to be done.
        draft.indicateurUn.formValidated = "None"
        draft.indicateurUn.coefficientRemuFormValidated = "None"

        if (!calculerIndicateurUn(state).effectifsIndicateurCalculable) {
          draft.indicateurUn.formValidated = "Valid"
          draft.indicateurUn.coefficientRemuFormValidated = "Valid"
        }

        // We have to traverse the coefficients to check if some groups are now invalid.
        // If so, we have to reset the remuneration to 0.
        draft.indicateurUn.coefficients.forEach((categorie) => {
          categorie.tranchesAges.forEach((trancheAge) => {
            if (!calculerValiditeGroupe3(trancheAge.nombreSalariesFemmes || 0, trancheAge.nombreSalariesHommes || 0)) {
              trancheAge.remunerationAnnuelleBrutFemmes = 0
              trancheAge.remunerationAnnuelleBrutHommes = 0
            }
          })
        })
      })
    }
    case "setInvalidIndicateurUnCoefEffectif": {
      return produce(state, (draft) => {
        draft.indicateurUn.coefficientEffectifFormValidated = "Invalid"
        draft.indicateurUn.formValidated = "Invalid"
      })
    }
    case "unsetIndicateurUnCoefEffectif": {
      return produce(state, (draft) => {
        draft.indicateurUn.coefficientEffectifFormValidated = "None"
        draft.indicateurUn.formValidated = "None"
        draft.declaration.formValidated = "Invalid"
      })
    }
    case "setValidIndicateurUnCoefRemuneration": {
      return produce(state, (draft) => {
        draft.indicateurUn.coefficientRemuFormValidated = "Valid"
        draft.indicateurUn.formValidated =
          state.indicateurUn.coefficientGroupFormValidated === "Valid" &&
          state.indicateurUn.coefficientEffectifFormValidated === "Valid"
            ? "Valid"
            : "None"
      })
    }
    case "setInvalidIndicateurUnCoefRemuneration": {
      return produce(state, (draft) => {
        draft.indicateurUn.coefficientRemuFormValidated = "Invalid"
        draft.indicateurUn.formValidated = "Invalid"
      })
    }
    case "unsetIndicateurUnCoefRemuneration": {
      return produce(state, (draft) => {
        draft.indicateurUn.coefficientRemuFormValidated = "None"
        draft.indicateurUn.formValidated = "None"
        draft.declaration.formValidated = "Invalid"
      })
    }
    case "setValidIndicateurUnModaliteCalcul": {
      return produce(state, (draft) => {
        draft.indicateurUn.modaliteCalculformValidated = "Valid"

        if (draft.indicateurUn.modaliteCalcul !== "csp") {
          draft.indicateurUn.formValidated =
            state.indicateurUn.coefficientGroupFormValidated === "Valid" &&
            state.indicateurUn.coefficientEffectifFormValidated === "Valid" &&
            state.indicateurUn.coefficientRemuFormValidated === "Valid"
              ? "Valid"
              : "None"
        } else {
          if (!calculerIndicateurUn(state).effectifsIndicateurCalculable) {
            draft.indicateurUn.formValidated = "Valid"
            draft.indicateurUn.modaliteCalculformValidated = "Valid"
          } else {
            draft.indicateurUn.formValidated = "None"
          }
        }
      })
    }
    case "unsetIndicateurUnModaliteCalcul": {
      return produce(state, (draft) => {
        draft.indicateurUn.modaliteCalculformValidated = "None"
        draft.indicateurUn.formValidated = "None"
        draft.declaration.formValidated = "Invalid"
      })
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
