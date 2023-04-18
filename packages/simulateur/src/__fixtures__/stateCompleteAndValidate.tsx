import flow from "lodash/fp/flow"

import { ActionType } from "../globals"
import { currifiedReducer as reducer } from "../app-reducer"
import stateComplete from "./stateComplete"

const actionValidateInformationsSimulation: ActionType = {
  type: "validateInformationsSimulation",
  valid: "Valid",
}

const actionValidateEffectif: ActionType = {
  type: "setValidEffectif",
}

const actionValidateIndicateurUnCoefGroup: ActionType = {
  type: "setValidIndicateurUnCoefGroup",
}

const actionValidateIndicateurUnCoefEffectif: ActionType = {
  type: "setValidIndicateurUnCoefEffectif",
}

const actionValidateIndicateurUn: ActionType = {
  // type: "validateIndicateurUn",
  type: "setValidIndicateurUnCSP",
}

const actionValidateIndicateurDeux: ActionType = {
  type: "validateIndicateurDeux",
  valid: "Valid",
}

const actionValidateIndicateurTrois: ActionType = {
  type: "validateIndicateurTrois",
  valid: "Valid",
}

const actionValidateIndicateurDeuxTrois: ActionType = {
  type: "validateIndicateurDeuxTrois",
  valid: "Valid",
}

const actionValidateIndicateurQuatre: ActionType = {
  type: "validateIndicateurQuatre",
  valid: "Valid",
}

const actionValidateIndicateurCinq: ActionType = {
  type: "validateIndicateurCinq",
  valid: "Valid",
}

const actionValidateInformationsEntreprise: ActionType = {
  type: "validateInformationsEntreprise",
  valid: "Valid",
}

const actionValidateInformationsDeclarant: ActionType = {
  type: "validateInformationsDeclarant",
  valid: "Valid",
}

const actionValidateDeclaration: ActionType = {
  type: "validateDeclaration",
  valid: "Valid",
  effectifData: {
    nombreSalariesTotal: 52,
  },
  indicateurUnData: {
    nombreCoefficients: 6,
    nonCalculable: false,
    motifNonCalculable: "",
    remunerationAnnuelle: [],
    coefficient: [],
    resultatFinal: 8.0,
    sexeSurRepresente: "femmes",
    noteFinale: 31,
  },
  indicateurDeuxData: {
    nonCalculable: false,
    motifNonCalculable: "",
    tauxAugmentation: [],
    resultatFinal: 5.0,
    sexeSurRepresente: "femmes",
    noteFinale: 10,
    mesuresCorrection: false,
  },
  indicateurTroisData: {
    nonCalculable: false,
    motifNonCalculable: "",
    tauxPromotion: [],
    resultatFinal: 3.0,
    sexeSurRepresente: "femmes",
    noteFinale: 15,
    mesuresCorrection: false,
  },
  indicateurDeuxTroisData: {
    nonCalculable: false,
    motifNonCalculable: "",
    resultatFinalEcart: 25,
    resultatFinalNombreSalaries: 5,
    sexeSurRepresente: "femmes",
    noteEcart: 25,
    noteNombreSalaries: 5,
    noteFinale: 25,
    mesuresCorrection: false,
  },
  indicateurQuatreData: {
    nonCalculable: false,
    motifNonCalculable: "",
    resultatFinal: 80.0,
    noteFinale: 0,
  },
  indicateurCinqData: {
    resultatFinal: 4.0,
    sexeSurRepresente: "hommes",
    noteFinale: 10,
  },
  noteIndex: 78,
  totalPoint: 66,
  totalPointCalculable: 85,
}

// Mock the Date for tests
const realDate = global.Date
// @ts-ignore
global.Date = jest.fn(() => new realDate(1578393480399))
global.Date.UTC = realDate.UTC

const stateDefault = flow(
  reducer(actionValidateInformationsSimulation),
  reducer(actionValidateEffectif),
  reducer(actionValidateIndicateurUnCoefGroup),
  reducer(actionValidateIndicateurUnCoefEffectif),
  reducer(actionValidateIndicateurUn),
  reducer(actionValidateIndicateurDeux),
  reducer(actionValidateIndicateurTrois),
  reducer(actionValidateIndicateurDeuxTrois),
  reducer(actionValidateIndicateurQuatre),
  reducer(actionValidateIndicateurCinq),
  reducer(actionValidateInformationsEntreprise),
  reducer(actionValidateInformationsDeclarant),
  reducer(actionValidateDeclaration),
)(stateComplete)

// Restore the Date
global.Date = realDate

export default stateDefault
