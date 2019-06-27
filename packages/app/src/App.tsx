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
import { getIndicatorsDatas, putIndicatorsDatas } from "./utils/api";
import { useDebounceEffect } from "./utils/hooks";

import AppReducer from "./AppReducer";

import GridProvider, { useLayoutType } from "./components/GridContext";
import ModalProvider from "./components/ModalContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Menu from "./components/Menu";
import ActivityIndicator from "./components/ActivityIndicator";

import FAQ from "./views/FAQ";

import Home from "./views/Home";
import HomeSimulateur from "./views/HomeSimulateur";
import Effectif from "./views/Effectif";
import IndicateurUn from "./views/Indicateur1";
import IndicateurDeux from "./views/Indicateur2";
import IndicateurTrois from "./views/Indicateur3";
import IndicateurQuatre from "./views/Indicateur4";
import IndicateurCinq from "./views/Indicateur5";
import Recapitulatif from "./views/Recapitulatif";
import PageNotFound from "./views/PageNotFound";

function App() {
  const [state, dispatch] = useReducer(AppReducer, undefined);
  return (
    <Router>
      <GridProvider>
        <AppLayout state={state} dispatch={dispatch} />
      </GridProvider>
    </Router>
  );
}

///////////////

interface AppLayout {
  state: AppState | undefined;
  dispatch: (action: ActionType) => void;
}

function AppLayout({ state, dispatch }: AppLayout) {
  const layoutType = useLayoutType();

  if (layoutType === "mobile") {
    return (
      <div css={styles.leftColumn}>
        <Header />
        <FAQ />
      </div>
    );
  }

  return (
    <div css={styles.layout}>
      <div css={styles.leftColumn}>
        <Header />

        <MainScrollViewWithRouter state={state}>
          <Switch>
            <Route
              path="/"
              exact
              render={props => <Home {...props} dispatch={dispatch} />}
            />
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

      <div
        css={[
          styles.rightColumn,
          layoutType === "tablet" && styles.rightColumnTablet
        ]}
      >
        <FAQ />
      </div>
    </div>
  );
}

///////////////

interface SimulateurProps {
  code: string;
  state: AppState | undefined;
  dispatch: (action: ActionType) => void;
}

function Simulateur({ code, state, dispatch }: SimulateurProps) {
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

///////////////

interface MainScrollViewProps extends RouteComponentProps {
  children: ReactNode;
  state: AppState | undefined;
}

function MainScrollView({ children, state, location }: MainScrollViewProps) {
  const scrollEl = useRef<HTMLDivElement>(null);

  const layoutType = useLayoutType();

  useEffect(() => {
    if (scrollEl.current) {
      if (scrollEl.current.scrollTo) {
        scrollEl.current.scrollTo(0, 0);
      } else {
        scrollEl.current.scrollTop = 0;
      }
    }
  }, [location.pathname]);

  const menu = (
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
  );

  if (layoutType === "tablet") {
    return (
      <div css={styles.main}>
        {menu}
        <div css={styles.scroll} ref={scrollEl}>
          <div css={styles.viewContainer}>
            <div css={styles.view}>{children}</div>
            <Footer />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div css={styles.main}>
      <ModalProvider>
        <div css={styles.scroll} ref={scrollEl}>
          <div css={styles.menu}>{menu}</div>
          <div css={styles.viewContainer}>
            <div css={styles.view}>{children}</div>
            <Footer />
          </div>
        </div>
      </ModalProvider>
    </div>
  );
}
const MainScrollViewWithRouter = withRouter(MainScrollView);

const styles = {
  layout: css({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    background:
      "linear-gradient(180deg, #FFFFFF 79px, rgba(255, 255, 255, 0) 79px, #FFFFFF 100%), #EFF0FA",
    "@media print": {
      display: "block"
    }
  }),
  leftColumn: css({
    display: "flex",
    flexDirection: "column",
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: globalStyles.grid.maxWidth - 375,
    minWidth: 0,
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
  rightColumnTablet: css({
    width: 320
  }),
  main: css({
    borderRight: "1px solid #EFECEF",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    position: "relative"
  }),
  scroll: css({
    overflowY: "auto",
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    position: "relative",
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
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    "@media print": {
      display: "block"
    }
  }),
  view: css({
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: "auto",
    display: "flex",
    flexDirection: "column"
  }),
  viewLoading: css({
    margin: "auto",
    alignSelf: "center"
  })
};

export default App;
