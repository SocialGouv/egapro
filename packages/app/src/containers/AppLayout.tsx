/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Route, Switch } from "react-router-dom";

import { AppState, ActionType } from "../globals.d";

import globalStyles from "../utils/globalStyles";

import { useLayoutType } from "../components/GridContext";
import Header from "../components/Header";

import CGU from "../views/CGU";
import FAQ from "../views/FAQ";
import Home from "../views/Home";
import MentionsLegales from "../views/MentionsLegales";
import PolitiqueConfidentialite from "../views/PolitiqueConfidentialite";
import PageNotFound from "../views/PageNotFound";

import Simulateur from "./Simulateur";
import MainScrollView from "./MainScrollView";
import MobileLayout from "./MobileLayout";
import ConsulterIndex from "../views/ConsulterIndex";

interface Props {
  state: AppState | undefined;
  dispatch: (action: ActionType) => void;
}

function AppLayout({ state, dispatch }: Props) {
  const layoutType = useLayoutType();

  return (
    <div css={styles.layout}>
      <Switch>
        <Route
          path="/consulter-index"
          render={() => (<ConsulterIndex />)}
        />
        <Route render={() => (
          layoutType === "mobile" ?
            <MobileLayout /> :
            <div css={styles.horizontalLayout}>
              <div css={styles.leftColumn}>
                <Header />
                <MainScrollView state={state}>
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
                    <Route
                      path="/mentions-legales"
                      exact
                      render={props => (
                        <MentionsLegales {...props} dispatch={dispatch} />
                      )}
                    />
                    <Route
                      path="/cgu"
                      exact
                      render={props => <CGU {...props} dispatch={dispatch} />}
                    />
                    <Route
                      path="/politique-confidentialite"
                      exact
                      render={props => (
                        <PolitiqueConfidentialite {...props} dispatch={dispatch} />
                      )}
                    />
                    <Route component={PageNotFound} />
                  </Switch>
                </MainScrollView>
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
        )}/>
      </Switch>
    </div>
  );
}

const styles = {
  layout: css({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    overflow: "auto",
    background:
      "linear-gradient(180deg, #FFFFFF 79px, rgba(255, 255, 255, 0) 79px, #FFFFFF 100%), #EFF0FA",
    "@media print": {
      display: "block"
    }
  }),
  leftColumn: css({
    display: "flex",
    flexDirection: "column",

    /* *** /!\ *** */
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: globalStyles.grid.maxWidth - 375,
    minWidth: 0,
    /*
      Fix issue with IE11
      the intention would be something like:

      flexGrow: 1,
      flexShrink: 1,
      flexBasis: "auto",
      maxWidth: globalStyles.grid.maxWidth - 375,

      but the code above is a workaround described here:
      https://github.com/philipwalton/flexbugs#flexbug-17
    */

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
  horizontalLayout: css({
    display: "flex"
  })
};

export default AppLayout;
