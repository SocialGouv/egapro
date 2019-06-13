/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useReducer, useEffect, useRef, useState, ReactNode } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  withRouter,
  RouteComponentProps
} from "react-router-dom";

import { AppState, ActionType } from "./globals.d";

import globalStyles from "./utils/globalStyles";

import { getIndicatorsDatas } from "./utils/api";

import AppReducer from "./AppReducer";

import GridProvider from "./components/GridContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Menu from "./components/Menu";
import ActivityIndicator from "./components/ActivityIndicator";

import FAQ from "./views/FAQ";

import Home from "./views/Home";
import HomeSimulateur from "./views/HomeSimulateur";
import GroupEffectif from "./views/GroupEffectif";
import IndicateurUn from "./views/Indicateur1";
import IndicateurDeux from "./views/Indicateur2";
import IndicateurTrois from "./views/Indicateur3";
import IndicateurQuatre from "./views/Indicateur4";
import IndicateurCinq from "./views/Indicateur5";
import Recapitulatif from "./views/Recapitulatif";
import PageNotFound from "./views/PageNotFound";

function App() {
  const [state, dispatch] = useReducer(AppReducer, undefined);

  useEffect(() => {
    const stateStringify = JSON.stringify(state);
    localStorage.setItem("egapro", stateStringify);
  }, [state]);

  return (
    <Router basename="/egapro">
      <GridProvider>
        <div css={styles.layout}>
          <div css={styles.leftColumn}>
            <Header />

            <MainScrollViewWithRouter state={state}>
              <Switch>
                <Route path="/" exact render={props => <Home {...props} />} />
                <Route
                  path="/simulateur/:code"
                  render={({
                    match: {
                      params: { code }
                    }
                  }) => (
                    <Simulateur code={code} state={state} dispatch={dispatch} />
                  )}
                />
                <Route component={PageNotFound} />
              </Switch>
            </MainScrollViewWithRouter>
          </div>

          <div css={styles.rightColumn}>
            <FAQ />
          </div>
        </div>
      </GridProvider>
    </Router>
  );
}

interface SimulateurProps {
  code: string;
  state: AppState | undefined;
  dispatch: (action: ActionType) => void;
}

function Simulateur({ code, state, dispatch }: SimulateurProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getIndicatorsDatas(code).then(({ jsonBody }) => {
      setLoading(false);
      dispatch({ type: "initiateState", data: jsonBody.data });
    });
  }, [code, dispatch]);

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
        render={props => <HomeSimulateur {...props} />}
      />
      <Route
        path="/simulateur/:code/effectifs"
        render={props => (
          <GroupEffectif {...props} state={state} dispatch={dispatch} />
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

interface MainScrollViewProps extends RouteComponentProps {
  children: ReactNode;
  state: AppState | undefined;
}

function MainScrollView({ children, state, location }: MainScrollViewProps) {
  const scrollEl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollEl.current) {
      scrollEl.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div css={styles.main} ref={scrollEl}>
      <div css={styles.menu}>
        <Menu
          effectifFormValidated={state ? state.effectif.formValidated : "None"}
          indicateurUnFormValidated={
            state ? state.indicateurUn.formValidated : "None"
          }
          indicateurDeuxFormValidated={
            state ? state.indicateurDeux.formValidated : "None"
          }
          indicateurTroisFormValidated={
            state ? state.indicateurTrois.formValidated : "None"
          }
          indicateurQuatreFormValidated={
            state ? state.indicateurQuatre.formValidated : "None"
          }
          indicateurCinqFormValidated={
            state ? state.indicateurCinq.formValidated : "None"
          }
        />
      </div>
      <div css={styles.viewContainer}>
        <div css={styles.view}>{children}</div>
        <Footer />
      </div>
    </div>
  );
}
const MainScrollViewWithRouter = withRouter(MainScrollView);

const styles = {
  layout: css({
    flex: 1,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    "@media print": {
      display: "block"
    }
  }),
  leftColumn: css({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    maxWidth: globalStyles.grid.maxWidth - 375,
    "@media print": {
      display: "block"
    }
  }),
  rightColumn: css({
    display: "flex",
    flexDirection: "column",
    width: 375,
    flexShrink: 0,
    "@media print": {
      display: "none"
    }
  }),
  main: css({
    overflowY: "auto",
    display: "flex",
    flex: 1,
    position: "relative",
    background:
      "linear-gradient(0.08deg, #FFFFFF 0.09%, rgba(255, 255, 255, 0) 99.84%), #EFF0FA",
    borderRight: "1px solid #EFECEF",
    "@media print": {
      overflow: "visible",
      display: "block",
      borderRight: "none",
      background: "none"
    }
  }),
  menu: css({
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingBottom: 80,
    "@media print": {
      display: "none"
    }
  }),
  viewContainer: css({
    display: "flex",
    flexDirection: "column",
    flex: 1,
    "@media print": {
      display: "block"
    },
    "@media all and (-ms-high-contrast: none), (-ms-high-contrast: active)": {
      // Only target IE11
      display: "block"
    }
  }),
  view: css({
    flex: 1,
    display: "flex",
    flexDirection: "column"
  }),
  viewLoading: css({
    margin: "auto"
  })
};

export default App;
