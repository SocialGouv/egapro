/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";

import { AppState, ActionType } from "../globals.d";

import globalStyles from "../utils/globalStyles";
import { getIndicatorsDatas, putIndicatorsDatas } from "../utils/api";
import { useDebounceEffect } from "../utils/hooks";

import ActivityIndicator from "../components/ActivityIndicator";

import HomeSimulateur from "../views/HomeSimulateur";
import Effectif from "../views/Effectif";
import IndicateurUn from "../views/Indicateur1";
import IndicateurDeux from "../views/Indicateur2";
import IndicateurTrois from "../views/Indicateur3";
import IndicateurQuatre from "../views/Indicateur4";
import IndicateurCinq from "../views/Indicateur5";
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
          (error.jsonBody && error.jsonBody.message) || "Erreur";
        setErrorMessage(errorMessage);
      });
  }, [code, dispatch]);

  useDebounceEffect(
    state,
    2000,
    debouncedState => {
      if (debouncedState) {
        putIndicatorsDatas(code, debouncedState);
      }
    },
    [code]
  );

  if (!loading && errorMessage) {
    return (
      <div css={styles.viewLoading}>
        <p>{errorMessage}</p>
      </div>
    );
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
