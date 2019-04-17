/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useReducer, useEffect } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import {
  TranchesAges,
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionType
} from "./globals.d";

import mapEnum from "./utils/mapEnum";

import Home from "./views/Home";
import GroupEffectif from "./views/GroupEffectif";
import IndicateurUn from "./views/IndicateurUn";
import IndicateurDeux from "./views/IndicateurDeux";

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

const defaultState: Array<Groupe> = [
  {
    categorieSocioPro: CategorieSocioPro.Ouvriers,
    tranchesAges: [...baseTranchesAge],
    tauxAugmentationFemmes: undefined,
    tauxAugmentationHommes: undefined
  },
  {
    categorieSocioPro: CategorieSocioPro.Employes,
    tranchesAges: [...baseTranchesAge],
    tauxAugmentationFemmes: undefined,
    tauxAugmentationHommes: undefined
  },
  {
    categorieSocioPro: CategorieSocioPro.Techniciens,
    tranchesAges: [...baseTranchesAge],
    tauxAugmentationFemmes: undefined,
    tauxAugmentationHommes: undefined
  },
  {
    categorieSocioPro: CategorieSocioPro.Cadres,
    tranchesAges: [...baseTranchesAge],
    tauxAugmentationFemmes: undefined,
    tauxAugmentationHommes: undefined
  }
];

function reducer(state: Array<Groupe>, action: ActionType) {
  switch (action.type) {
    case "updateEffectif":
    case "updateIndicateurUn": {
      const index = state.findIndex(
        ({ categorieSocioPro }) =>
          categorieSocioPro === action.group.categorieSocioPro
      );
      return [
        ...state.slice(0, index),
        action.group,
        ...state.slice(index + 1)
      ];
    }
    case "updateIndicateurDeux": {
      return state.map((group: Groupe) => {
        const datum = action.data.find(
          ({ categorieSocioPro }) =>
            categorieSocioPro === group.categorieSocioPro
        );
        return Object.assign({}, group, datum);
      });
    }
    default:
      return state;
  }
}

const localStorageEgapro = localStorage.getItem("egapro");
const initialState = localStorageEgapro
  ? JSON.parse(localStorageEgapro)
  : defaultState;

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const stateStringify = JSON.stringify(state);
    localStorage.setItem("egapro", stateStringify);
  }, [state]);

  return (
    <Router>
      <div>
        <header css={styles.header}>
          <p>EGAPRO - Prototype</p>
        </header>
        <Switch>
          <Route path="/" exact render={props => <Home {...props} />} />
          <Route
            path="/effectifs/:categorieSocioPro"
            render={props => (
              <GroupEffectif
                {...props}
                key={props.match.params.categorieSocioPro}
                effectif={state[props.match.params.categorieSocioPro]}
                updateEffectif={(group: Groupe) =>
                  dispatch({ type: "updateEffectif", group })
                }
              />
            )}
          />
          <Route
            path="/indicateur1"
            render={props => (
              <IndicateurUn {...props} state={state} dispatch={dispatch} />
            )}
          />
          <Route
            path="/indicateur2"
            render={props => (
              <IndicateurDeux {...props} state={state} dispatch={dispatch} />
            )}
          />
        </Switch>
      </div>
    </Router>
  );
}

const styles = {
  header: css({
    backgroundColor: "#282c34",
    minHeight: "10vh",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "calc(10px + 2vmin)",
    color: "white",
    textAlign: "center"
  })
};

export default App;
