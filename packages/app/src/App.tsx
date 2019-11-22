import React, { useReducer, useCallback } from "react";
import { Router } from "react-router-dom";
import ReactPiwik from "react-piwik";
import { createBrowserHistory } from "history";

import { ActionType } from "./globals.d";
import AppReducer from "./AppReducer";

import GridProvider from "./components/GridContext";
import AppLayout from "./containers/AppLayout";

const history = createBrowserHistory();

const piwik: any = new ReactPiwik({
  url: "matomo.fabrique.social.gouv.fr",
  siteId: 11,
  trackErrors: true
});

// track the initial pageview
ReactPiwik.push(["trackPageView"]);

const validateActions = [
  "validateEffectif",
  "validateIndicateurUnCoefGroup",
  "validateIndicateurUnCoefEffectif",
  "validateIndicateurUn",
  "validateIndicateurDeux",
  "validateIndicateurTrois",
  "validateIndicateurQuatre",
  "validateIndicateurCinq"
];

function App() {
  const [state, dispatchReducer] = useReducer(AppReducer, undefined);

  const dispatch = useCallback(
    (action: ActionType) => {
      if (
        validateActions.includes(action.type) &&
        // @ts-ignore
        action.valid &&
        // @ts-ignore
        action.valid === "Valid"
      ) {
        ReactPiwik.push(["trackEvent", "validateForm", action.type]);
      }
      dispatchReducer(action);
    },
    [dispatchReducer]
  );

  return (
    <Router history={piwik.connectToHistory(history)}>
      <GridProvider>
        <AppLayout state={state} dispatch={dispatch} />
      </GridProvider>
    </Router>
  );
}

export default App;
