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
    totalNbSalarieHomme,
    totalNbSalarieFemme
  } = state.effectif.nombreSalaries.reduce(
    (acc, { tranchesAges }) => {
      const {
        totalGroupNbSalarieHomme,
        totalGroupNbSalarieFemme
      } = tranchesAges.reduce(
        (accGroup, { nombreSalariesHommes, nombreSalariesFemmes }) => {
          return {
            totalGroupNbSalarieHomme:
              accGroup.totalGroupNbSalarieHomme + (nombreSalariesHommes || 0),
            totalGroupNbSalarieFemme:
              accGroup.totalGroupNbSalarieFemme + (nombreSalariesFemmes || 0)
          };
        },
        { totalGroupNbSalarieHomme: 0, totalGroupNbSalarieFemme: 0 }
      );

      return {
        totalNbSalarieHomme: acc.totalNbSalarieHomme + totalGroupNbSalarieHomme,
        totalNbSalarieFemme: acc.totalNbSalarieFemme + totalGroupNbSalarieFemme
      };
    },
    { totalNbSalarieHomme: 0, totalNbSalarieFemme: 0 }
  );

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
              totalNbSalarieFemme={totalNbSalarieFemme}
              totalNbSalarieHomme={totalNbSalarieHomme}
              validateEffectif={validateEffectif}
            />
          )
        }
      />

      {state.effectif.formValidated === "Valid" &&
        (state.indicateurUn.formValidated === "Invalid" ||
          state.indicateurDeux.formValidated === "Invalid" ||
          state.indicateurTrois.formValidated === "Invalid") && (
          <InfoBloc
            title="Vos effectifs ont été modifiés"
            icon="cross"
            text={
              <Fragment>
                <span>
                  afin de s'assurer de la cohérence de votre index, merci de
                  vérifier les données de vos indicateurs.
                </span>
                <br />
                <span>
                  {state.indicateurUn.formValidated === "Invalid" && (
                    <Fragment>
                      <TextSimulatorLink
                        to="/indicateur1"
                        label="aller à l'indicateur 1"
                      />
                      &emsp;
                    </Fragment>
                  )}
                  {state.indicateurDeux.formValidated === "Invalid" && (
                    <Fragment>
                      <TextSimulatorLink
                        to="/indicateur2"
                        label="aller à l'indicateur 2"
                      />
                      &emsp;
                    </Fragment>
                  )}
                  {state.indicateurTrois.formValidated === "Invalid" && (
                    <TextSimulatorLink
                      to="/indicateur3"
                      label="aller à l'indicateur 3"
                    />
                  )}
                </span>
              </Fragment>
            }
          />
        )}
    </Page>
  );
}

export default Effectif;
