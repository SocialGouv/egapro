import { FormState } from "../globals.d";
import AppReducer from "../AppReducer";

import stateComplete from "./stateComplete";

const actionValidateInformations = {
  type: "validateInformations" as "validateInformations",
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

// fast pipe, I miss you in JS…
const stateDefault = AppReducer(
  AppReducer(
    AppReducer(
      AppReducer(
        AppReducer(
          AppReducer(
            AppReducer(
              AppReducer(
                AppReducer(
                  AppReducer(stateComplete, actionValidateInformations),
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
);

export default stateDefault;
