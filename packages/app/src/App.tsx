import React, { useReducer } from "react";
import { Router } from "react-router-dom";
import ReactPiwik from "react-piwik";
import { createBrowserHistory } from "history";
import AppReducer from "./AppReducer";

import GridProvider from "./components/GridContext";

import AppLayout from "./containers/AppLayout";

const history = createBrowserHistory();

const piwik = new ReactPiwik({
  url: "stats.num.social.gouv.fr",
  siteId: 11,
  trackErrors: true
});

// track the initial pageview
ReactPiwik.push(["trackPageView"]);

function App() {
  const [state, dispatch] = useReducer(AppReducer, undefined);
  return (
    <Router history={piwik.connectToHistory(history)}>
      <GridProvider>
        <AppLayout state={state} dispatch={dispatch} />
      </GridProvider>
    </Router>
  );
}

export default App;
