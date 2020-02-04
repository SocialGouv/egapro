import { FormState } from "../globals.d";
import AppReducer from "../AppReducer";

import stateComplete from "./stateComplete";

const actionValidateInformationsSimulation = {
  type: "validateInformationsSimulation" as "validateInformationsSimulation",
  valid: "Valid" as FormState
};

const actionValidateEffectif = {
  type: "validateEffectif" as "validateEffectif",
  valid: "Valid" as FormState
};

const actionValidateIndicateurUnCoefGroup = {
  type: "validateIndicateurUnCoefGroup" as "validateIndicateurUnCoefGroup",
  valid: "Valid" as FormState
};

const actionValidateIndicateurUnCoefEffectif = {
  type: "validateIndicateurUnCoefEffectif" as "validateIndicateurUnCoefEffectif",
  valid: "Valid" as FormState
};

const actionValidateIndicateurUn = {
  type: "validateIndicateurUn" as "validateIndicateurUn",
  valid: "Valid" as FormState
};

const actionValidateIndicateurDeux = {
  type: "validateIndicateurDeux" as "validateIndicateurDeux",
  valid: "Valid" as FormState
};

const actionValidateIndicateurTrois = {
  type: "validateIndicateurTrois" as "validateIndicateurTrois",
  valid: "Valid" as FormState
};

const actionValidateIndicateurDeuxTrois = {
  type: "validateIndicateurDeuxTrois" as "validateIndicateurDeuxTrois",
  valid: "Valid" as FormState
};

const actionValidateIndicateurQuatre = {
  type: "validateIndicateurQuatre" as "validateIndicateurQuatre",
  valid: "Valid" as FormState
};

const actionValidateIndicateurCinq = {
  type: "validateIndicateurCinq" as "validateIndicateurCinq",
  valid: "Valid" as FormState
};

const actionValidateInformationsEntreprise = {
  type: "validateInformationsEntreprise" as "validateInformationsEntreprise",
  valid: "Valid" as FormState
};

const actionValidateInformationsDeclarant = {
  type: "validateInformationsDeclarant" as "validateInformationsDeclarant",
  valid: "Valid" as FormState
};

const actionValidateDeclaration = {
  type: "validateDeclaration" as "validateDeclaration",
  valid: "Valid" as FormState,
  indicateurUnData: {
    nombreCoefficients: 6,
    motifNonCalculable: "",
    motifNonCalculablePrecision: "",
    resultatFinal: 8.0,
    sexeSurRepresente: "femmes" as undefined | "femmes" | "hommes",
    noteFinale: 31
  },
  indicateurDeuxData: {
    motifNonCalculable: "",
    motifNonCalculablePrecision: "",
    resultatFinal: 5.0,
    sexeSurRepresente: "femmes" as undefined | "femmes" | "hommes",
    noteFinale: 10,
    mesuresCorrection: false
  },
  indicateurTroisData: {
    motifNonCalculable: "",
    motifNonCalculablePrecision: "",
    resultatFinal: 3.0,
    sexeSurRepresente: "femmes" as undefined | "femmes" | "hommes",
    noteFinale: 15,
    mesuresCorrection: false
  },
  indicateurDeuxTroisData: {
    motifNonCalculable: "",
    motifNonCalculablePrecision: "",
    resultatFinalEcart: 25,
    resultatFinalNombreSalaries: 5,
    sexeSurRepresente: "femmes" as undefined | "femmes" | "hommes",
    noteFinale: 25,
    mesuresCorrection: false
  }
};

// Mock the Date for tests
const realDate = global.Date;
// @ts-ignore
global.Date = jest.fn(() => new realDate(1578393480399));

const stateDefault = AppReducer(
  AppReducer(
    AppReducer(
      AppReducer(
        AppReducer(
          AppReducer(
            AppReducer(
              AppReducer(
                AppReducer(
                  AppReducer(
                    AppReducer(
                      AppReducer(
                        AppReducer(
                          stateComplete,
                          actionValidateInformationsSimulation
                        ),
                        actionValidateEffectif
                      ),
                      actionValidateIndicateurUnCoefGroup
                    ),
                    actionValidateIndicateurUnCoefEffectif
                  ),
                  actionValidateIndicateurUn
                ),
                actionValidateIndicateurDeux
              ),
              actionValidateIndicateurTrois
            ),
            actionValidateIndicateurDeuxTrois
          ),
          actionValidateIndicateurQuatre
        ),
        actionValidateIndicateurCinq
      ),
      actionValidateInformationsEntreprise
    ),
    actionValidateInformationsDeclarant
  ),
  actionValidateDeclaration
);

// Restore the Date
global.Date = realDate;

export default stateDefault;
