/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useReducer, useEffect, useCallback, ReactNode } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  withRouter,
  RouteComponentProps
} from "react-router-dom";

import {
  AppState,
  FormState,
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
import IndicateurQuatre from "./views/IndicateurQuatre";
import PageNotFound from "./views/PageNotFound";

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
  effectif: {
    formValidated: "None"
  },
  indicateurUn: {
    formValidated: "None"
  },
  indicateurDeux: {
    formValidated: "None",
    presenceAugmentation: true
  },
  indicateurTrois: {
    formValidated: "None",
    presencePromotion: true
  },
  indicateurQuatre: {
    formValidated: "None",
    presenceAugmentation: true,
    nombreSalariees: undefined,
    nombreSalarieesPeriodeAugmentation: undefined,
    nombreSalarieesAugmentees: undefined
  }
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

  const validateEffectif = useCallback(
    (valid: FormState) => dispatch({ type: "validateEffectif", valid }),
    [dispatch]
  );

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
                  path="/effectifs"
                  render={props => (
                    <GroupEffectif
                      {...props}
                      state={state}
                      updateEffectif={updateEffectif}
                      validateEffectif={validateEffectif}
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
                <Route
                  path="/indicateur4"
                  render={props => (
                    <IndicateurQuatre
                      {...props}
                      state={state}
                      dispatch={dispatch}
                    />
                  )}
                />
                <Route component={PageNotFound} />
              </Switch>
            </MainScrollViewWithRouter>
          </div>

          <div css={styles.rightColumn} />
        </div>
      </GridProvider>
    </Router>
  );
}

interface MainScrollViewProps extends RouteComponentProps {
  children: ReactNode;
  state: AppState;
}

function MainScrollView({ children, state, location }: MainScrollViewProps) {
  // Usefull to reset the scroll while navigating
  return (
    <div css={styles.main} key={location.key}>
      <div css={styles.menu}>
        <Menu
          effectifFormValidated={state.effectif.formValidated}
          indicateurUnFormValidated={state.indicateurUn.formValidated}
          indicateurDeuxFormValidated={state.indicateurDeux.formValidated}
          indicateurTroisFormValidated={state.indicateurTrois.formValidated}
          indicateurQuatreFormValidated={state.indicateurQuatre.formValidated}
        />
      </div>
      <div css={styles.view}>{children}</div>
    </div>
  );
}
const MainScrollViewWithRouter = withRouter(MainScrollView);

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
    flexShrink: 0,
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
