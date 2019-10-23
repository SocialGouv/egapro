/** @jsx jsx */
import { jsx } from "@emotion/core";
import { Fragment, useCallback } from "react";
import { RouteComponentProps } from "react-router-dom";
import {
  AppState,
  ActionType,
  FormState,
  ActionEffectifData
} from "../../globals.d";
import totalNombreSalaries from "../../utils/totalNombreSalaries";

import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";
import InfoBloc from "../../components/InfoBloc";
import { TextSimulatorLink } from "../../components/SimulatorLink";

import EffectifForm from "./EffectifForm";
import EffectifResult from "./EffectifResult";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function Effectif({ state, dispatch }: Props) {
  const updateEffectif = useCallback(
    (data: ActionEffectifData) => dispatch({ type: "updateEffectif", data }),
    [dispatch]
  );

  const validateEffectif = useCallback(
    (valid: FormState) => dispatch({ type: "validateEffectif", valid }),
    [dispatch]
  );

  const {
    totalNombreSalariesHomme: totalNombreSalariesHommeCsp,
    totalNombreSalariesFemme: totalNombreSalariesFemmeCsp
  } = totalNombreSalaries(state.effectif.nombreSalaries);
  const {
    totalNombreSalariesHomme: totalNombreSalariesHommeCoef,
    totalNombreSalariesFemme: totalNombreSalariesFemmeCoef
  } = totalNombreSalaries(state.indicateurUn.coefficient);

  return (
    <Page
      title="Indication des effectifs"
      tagline="Les effectifs pris en compte pour le calcul doivent être renseignés par catégorie socio-professionnelle (CSP) et tranche d’âge."
    >
      <LayoutFormAndResult
        childrenForm={
          <EffectifForm
            effectif={state.effectif}
            readOnly={state.effectif.formValidated === "Valid"}
            updateEffectif={updateEffectif}
            validateEffectif={validateEffectif}
          />
        }
        childrenResult={
          state.effectif.formValidated === "Valid" && (
            <EffectifResult
              totalNombreSalariesFemme={totalNombreSalariesFemmeCsp}
              totalNombreSalariesHomme={totalNombreSalariesHommeCsp}
              validateEffectif={validateEffectif}
            />
          )
        }
      />

      {state.effectif.formValidated === "Valid" &&
        (state.indicateurUn.formValidated === "Invalid" ||
          state.indicateurDeux.formValidated === "Invalid" ||
          state.indicateurTrois.formValidated === "Invalid" ||
          state.indicateurDeuxTrois.formValidated === "Invalid") && (
          <InfoBloc
            title="Vos effectifs ont été modifiés"
            icon="cross"
            text={
              <Fragment>
                <span>
                  afin de s'assurer de la cohérence de votre index, merci de
                  vérifier les données de vos indicateurs.
                </span>
                &emsp;
                <span>
                  {state.indicateurUn.formValidated === "Invalid" && (
                    <Fragment>
                      <TextSimulatorLink
                        to="/indicateur1"
                        label="aller à l'indicateur écart de rémunérations"
                      />
                      &emsp;
                    </Fragment>
                  )}
                  {state.indicateurDeux.formValidated === "Invalid" && (
                    <Fragment>
                      <TextSimulatorLink
                        to="/indicateur2"
                        label="aller à l'indicateur écart de taux d'augmentations"
                      />
                      &emsp;
                    </Fragment>
                  )}
                  {state.indicateurTrois.formValidated === "Invalid" && (
                    <Fragment>
                      <TextSimulatorLink
                        to="/indicateur3"
                        label="aller à l'indicateur écart de taux de promotions"
                      />
                      &emsp;
                    </Fragment>
                  )}
                  {state.indicateurDeuxTrois.formValidated === "Invalid" && (
                    <TextSimulatorLink
                      to="/indicateur2et3"
                      label="aller à l'indicateur écart de taux d'augmentations"
                    />
                  )}
                </span>
              </Fragment>
            }
          />
        )}

      {state.effectif.formValidated === "Valid" &&
        state.indicateurUn.formValidated === "Valid" &&
        (totalNombreSalariesHommeCoef !== totalNombreSalariesHommeCsp ||
          totalNombreSalariesFemmeCoef !== totalNombreSalariesFemmeCsp) && (
          <InfoBloc
            title="Attention, vos effectifs ne sont pas les mêmes que ceux déclarés en niveaux ou coefficients hiérarchiques"
            icon="cross"
          />
        )}
    </Page>
  );
}

export default Effectif;
