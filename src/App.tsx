/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useReducer, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import {
  AppState,
  TranchesAges,
  CategorieSocioPro,
  ActionEffectifData
} from "./globals.d";

import globalStyles from "./utils/globalStyles";
import mapEnum from "./utils/mapEnum";

import AppReducer from "./AppReducer";

import GridProvider from "./components/GridContext";
import Header from "./components/Header";
import Menu from "./components/Menu";

import Home from "./views/Home";
import GroupEffectif from "./views/GroupEffectif";
import IndicateurUn from "./views/IndicateurUn";
import IndicateurDeux from "./views/IndicateurDeux";
import IndicateurTrois from "./views/IndicateurTrois";

const baseGroupTranchesAgesState = {
  nombreSalariesFemmes: undefined,
  nombreSalariesHommes: undefined,
  remunerationAnnuelleBrutFemmes: undefined,
  remunerationAnnuelleBrutHommes: undefined
};

const baseTranchesAge = mapEnum(TranchesAges, (trancheAge: TranchesAges) => ({
  trancheAge,
  ...baseGroupTranchesAgesState
}));

const baseGroupe = {
  tranchesAges: [...baseTranchesAge],
  tauxAugmentationFemmes: undefined,
  tauxAugmentationHommes: undefined,
  tauxPromotionFemmes: undefined,
  tauxPromotionHommes: undefined
};

const defaultState: AppState = {
  data: [
    {
      categorieSocioPro: CategorieSocioPro.Ouvriers,
      ...baseGroupe
    },
    {
      categorieSocioPro: CategorieSocioPro.Employes,
      ...baseGroupe
    },
    {
      categorieSocioPro: CategorieSocioPro.Techniciens,
      ...baseGroupe
    },
    {
      categorieSocioPro: CategorieSocioPro.Cadres,
      ...baseGroupe
    }
  ],
  formEffectifValidated: false,
  formIndicateurUnValidated: false
};

const localStorageEgapro = localStorage.getItem("egapro");
const initialState = localStorageEgapro
  ? JSON.parse(localStorageEgapro)
  : defaultState;

function App() {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  useEffect(() => {
    const stateStringify = JSON.stringify(state);
    localStorage.setItem("egapro", stateStringify);
  }, [state]);

  const updateEffectif = useCallback(
    (data: ActionEffectifData) => dispatch({ type: "updateEffectif", data }),
    [dispatch]
  );

  const saveEffectif = useCallback(
    (data: ActionEffectifData) => dispatch({ type: "saveEffectif", data }),
    [dispatch]
  );

  return (
    <Router>
      <GridProvider>
        <div css={styles.layout}>
          <div css={styles.leftColumn}>
            <Header />

            <div css={styles.main}>
              <div css={styles.menu}>
                <Menu
                  formEffectifValidated={state.formEffectifValidated}
                  formIndicateurUnValidated={state.formIndicateurUnValidated}
                />
              </div>
              <div css={styles.view}>
                <Switch>
                  <Route path="/" exact render={props => <Home {...props} />} />
                  <Route
                    path="/effectifs"
                    render={props => (
                      <GroupEffectif
                        {...props}
                        state={state}
                        updateEffectif={updateEffectif}
                        saveEffectif={saveEffectif}
                      />
                    )}
                  />
                  <Route
                    path="/indicateur1"
                    render={props => (
                      <IndicateurUn
                        {...props}
                        state={state}
                        dispatch={dispatch}
                      />
                    )}
                  />
                  <Route
                    path="/indicateur2"
                    render={props => (
                      <IndicateurDeux
                        {...props}
                        state={state}
                        dispatch={dispatch}
                      />
                    )}
                  />
                  <Route
                    path="/indicateur3"
                    render={props => (
                      <IndicateurTrois
                        {...props}
                        state={state}
                        dispatch={dispatch}
                      />
                    )}
                  />
                </Switch>
              </div>
            </div>
          </div>
          <div css={styles.rightColumn} />
        </div>
      </GridProvider>
    </Router>
  );
}

const styles = {
  layout: css({
    flex: 1,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center"
  }),
  leftColumn: css({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    maxWidth: globalStyles.grid.maxWidth - 375
  }),
  rightColumn: css({
    display: "flex",
    flexDirection: "column",
    width: 375,
    backgroundColor: "#AAAEE1"
  }),
  main: css({
    overflowY: "auto",
    display: "flex",
    flex: 1,
    position: "relative",
    background:
      "linear-gradient(0.08deg, #FFFFFF 0.09%, rgba(255, 255, 255, 0) 99.84%), rgba(138, 146, 217, 0.14)"
  }),
  menu: css({
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingBottom: 80
  }),
  view: css({
    flex: 1
  })
};

export default App;
