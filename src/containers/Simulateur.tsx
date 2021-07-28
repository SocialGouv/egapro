/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment, useEffect, useState } from "react";
import { Route, Switch, useHistory } from "react-router-dom";

import { AppState, ActionType } from "../globals";

import { logToSentry } from "../utils/helpers";

import globalStyles from "../utils/globalStyles";
import {
  getIndicatorsDatas,
  getTokenInfo,
  putIndicatorsDatas,
} from "../utils/api";
import { useDebounceEffect } from "../utils/hooks";

import ActivityIndicator from "../components/ActivityIndicator";
import ErrorMessage from "../components/ErrorMessage";

import Declaration from "../views/Declaration";
import Effectif from "../views/Effectif";
import HomeSimulateur, {
  HomeSimulateurRouteComponentProps,
} from "../views/HomeSimulateur";
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
import AskEmail from "../views/AskEmail";

interface TokenInfo {
  email: string;
  déclarations: [Declaration];
  ownership: [string];
}

interface Declaration {
  declared_at: Number;
  modified_at: Number;
  name: string;
  siren: string;
  year: Number;
}

interface Props {
  code: string;
  state: AppState | undefined;
  dispatch: (action: ActionType) => void;
}

function Simulateur({ code, state, dispatch }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | undefined>(undefined);
  const [tokenInfo, setTokenInfo] =
    useState<undefined | "error" | TokenInfo>(undefined);
  const history = useHistory();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("token")) {
    localStorage.setItem("token", urlParams.get("token") || "");
    // Reset the token in the search params so it won't be in the URL and won't be bookmarkable (which is a bad practice?)
    history.push({ search: "" });
  }
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    setErrorMessage(undefined);
    getTokenInfo()
      .then(({ jsonBody }) => {
        setLoading(false);
        setTokenInfo(jsonBody);
        dispatch({
          type: "updateEmailDeclarant",
          data: { email: jsonBody.email },
        });
      })
      .catch((error) => {
        setLoading(false);
        setTokenInfo("error");
      });
  }, [token]);

  useEffect(() => {
    setLoading(true);
    setErrorMessage(undefined);
    getIndicatorsDatas(code)
      .then(({ jsonBody }) => {
        setLoading(false);
        dispatch({ type: "initiateState", data: jsonBody.data });
      })
      .catch((error) => {
        setLoading(false);
        const message =
          error.jsonBody && error.jsonBody.error
            ? `Les données de votre déclaration n'ont pû être récupérées : ${error.jsonBody.error}`
            : "Erreur lors de la récupération des données";
        setErrorMessage(message);
      });
  }, [code, dispatch]);

  useDebounceEffect(
    state,
    2000,
    (debouncedState) => {
      if (debouncedState) {
        putIndicatorsDatas(code, debouncedState).catch((error) => {
          setLoading(false);
          const message =
            error.jsonBody && error.jsonBody.error
              ? `Votre déclaration ne peut être validée : ${error.jsonBody.error}`
              : "Erreur lors de la sauvegarde des données";
          setErrorMessage(message);
          logToSentry(error, debouncedState);
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
        render={(props) => {
          const foo = props as HomeSimulateurRouteComponentProps;
          return <HomeSimulateur {...foo} code={code} />;
        }}
      />
      <Route
        path="/simulateur/:code/informations"
        render={(props) => (
          <InformationsSimulation
            {...props}
            state={state}
            dispatch={dispatch}
          />
        )}
      />
      <Route
        path="/simulateur/:code/effectifs"
        render={(props) => (
          <Effectif {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur1"
        render={(props) => (
          <IndicateurUn {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur2"
        render={(props) => (
          <IndicateurDeux {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur3"
        render={(props) => (
          <IndicateurTrois {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur2et3"
        render={(props) => (
          <IndicateurDeuxTrois {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur4"
        render={(props) => (
          <IndicateurQuatre {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/indicateur5"
        render={(props) => (
          <IndicateurCinq {...props} state={state} dispatch={dispatch} />
        )}
      />
      <Route
        path="/simulateur/:code/recapitulatif"
        render={(props) => <Recapitulatif {...props} state={state} />}
      />
      {tokenInfo === undefined ? (
        <AskEmail code={code} />
      ) : tokenInfo === "error" ? (
        <Fragment>
          <p></p>
          <AskEmail
            code={code}
            tagLine="La session est expirée, veuillez fournir votre email afin de recevoir un lien vous permettant de la rafraîchir."
          />
        </Fragment>
      ) : (
        <Fragment>
          <Route
            path="/simulateur/:code/informations-entreprise"
            render={(props) => (
              <InformationsEntreprise
                {...props}
                state={state}
                dispatch={dispatch}
              />
            )}
          />
          <Route
            path="/simulateur/:code/informations-declarant"
            render={(props) => (
              <InformationsDeclarant
                {...props}
                state={state}
                dispatch={dispatch}
              />
            )}
          />
          <Route
            path="/simulateur/:code/declaration"
            render={(props) => (
              <Declaration
                {...props}
                code={code}
                state={state}
                dispatch={dispatch}
              />
            )}
          />
        </Fragment>
      )}
    </Switch>
  );
}

const styles = {
  viewLoading: css({
    margin: "auto",
    alignSelf: "center",
  }),
};

export default Simulateur;
