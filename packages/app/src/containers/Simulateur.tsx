/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";

import { AppState, ActionType } from "../globals.d";

import globalStyles from "../utils/globalStyles";
import { getIndicatorsDatas, putIndicatorsDatas } from "../utils/api";
import { useDebounceEffect } from "../utils/hooks";

import ActivityIndicator from "../components/ActivityIndicator";
import ErrorMessage from "../components/ErrorMessage";

import Declaration from "../views/Declaration";
import Effectif from "../views/Effectif";
import HomeSimulateur from "../views/HomeSimulateur";
import IndicateurUn from "../views/Indicateur1";
import IndicateurDeux from "../views/Indicateur2";
import IndicateurTrois from "../views/Indicateur3";
import IndicateurDeuxTrois from "../views/Indicateur2et3";
import IndicateurQuatre from "../views/Indicateur4";
import IndicateurCinq from "../views/Indicateur5";
import InformationsEntreprise from "../views/InformationsEntreprise";
import InformationsDeclarant from "../views/InformationsDeclarant";
import InformationsSimulation from "../views/InformationsSimulation";
import Recapitulatif from "../views/Recapitulatif";

interface Props {
  code: string;
  state: AppState | undefined;
  dispatch: (action: ActionType) => void;
}

function Simulateur({ code, state, dispatch }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(undefined);

  useEffect(() => {
    setLoading(true);
    setErrorMessage(undefined);
    getIndicatorsDatas(code)
      .then(({ jsonBody }) => {
        setLoading(false);
        dispatch({ type: "initiateState", data: jsonBody.data });
      })
      .catch(error => {
        setLoading(false);
        const errorMessage =
          (error.jsonBody && error.jsonBody.message) ||
          "Erreur lors de la récupération des données";
        setErrorMessage(errorMessage);
      });
  }, [code, dispatch]);

  useDebounceEffect(
    state,
    2000,
    debouncedState => {
      if (debouncedState) {
        putIndicatorsDatas(code, debouncedState).catch(error => {
          setLoading(false);
          const errorMessage =
            (error.jsonBody && error.jsonBody.message) ||
            "Erreur lors de la sauvegarde des données";
          setErrorMessage(errorMessage);
        });
      }
    },
    [code]
  );

  if (!loading && errorMessage) {
    return ErrorMessage(errorMessage);
  }

  if (loading || !state) {
    return (
      <div css={styles.viewLoading}>
        <ActivityIndicator size={30} color={globalStyles.colors.primary} />
      </div>
    );
  }

  return (
    <Switch>
      <Route
        path="/simulateur/:code/"
        exact
        render={props => <HomeSimulateur {...props} code={code} />}
      />
      <Route
        path="/simulateur/:code/informations"
        render={props => (
          <InformationsSimulation
            {...props}
            state={state}
            dispatch={dispatch}
          />
        )}
      />
      <Route
        path="/simulateur/:code/effectifs"
        render={props => (
          <Effectif {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur1"
        render={props => (
          <IndicateurUn {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur2"
        render={props => (
          <IndicateurDeux {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur3"
        render={props => (
          <IndicateurTrois {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur2et3"
        render={props => (
          <IndicateurDeuxTrois {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur4"
        render={props => (
          <IndicateurQuatre {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur5"
        render={props => (
          <IndicateurCinq {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/recapitulatif"
        render={props => <Recapitulatif {...props} state={state} />}
      />
      <Route
        path="/simulateur/:code/informations-entreprise"
        render={props => (
          <InformationsEntreprise
            {...props}
            state={state}
            dispatch={dispatch}
          />
        )}
      />
      <Route
        path="/simulateur/:code/informations-declarant"
        render={props => (
          <InformationsDeclarant {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/declaration"
        render={props => (
          <Declaration {...props} code={code}state={state} dispatch={dispatch} />
        )}
      />
    </Switch>
  );
}

const styles = {
  viewLoading: css({
    margin: "auto",
    alignSelf: "center"
  })
};

export default Simulateur;
