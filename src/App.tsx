/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useReducer } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";

import {
  TranchesAges,
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionType
} from "./globals.d";

import mapEnum from "./utils/mapEnum";

import {
  calculValiditeGroupe,
  calculEffectifsValides,
  calculEcartRemunerationMoyenne,
  calculEcartApresApplicationSeuilPertinence,
  calculEcartPondere,
  calculIndicateurCalculable,
  calculIndicateurEcartRemuneration,
  calculNote
} from "./utils/calculsEgaPro";

import GroupEffectif from "./views/GroupEffectif";
import GroupValid from "./views/GroupValid";
import IndicateurUn from "./views/IndicateurUn";
import IndicateurUnResult from "./views/IndicateurUnResult";

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

const initialDataIndex: Groupe = {
  categorieSocioPro: CategorieSocioPro.Ouvriers,
  tranchesAges: [...baseTranchesAge]
};

function reducer(state: Groupe, action: ActionType) {
  switch (action.type) {
    case "updateEffectif":
      return action.group;
    case "updateIndicateurUn":
      return action.group;
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialDataIndex);

  const computedDataByRow = state.tranchesAges.map(
    ({
      nombreSalariesFemmes,
      nombreSalariesHommes,
      remunerationAnnuelleBrutFemmes,
      remunerationAnnuelleBrutHommes
    }: GroupTranchesAges) => {
      nombreSalariesFemmes = nombreSalariesFemmes || 0;
      nombreSalariesHommes = nombreSalariesHommes || 0;
      remunerationAnnuelleBrutFemmes = remunerationAnnuelleBrutFemmes || 0;
      remunerationAnnuelleBrutHommes = remunerationAnnuelleBrutHommes || 0;

      // VG
      const validiteGroupe = calculValiditeGroupe(
        nombreSalariesFemmes,
        nombreSalariesHommes
      );
      // EV
      const effectifsValides = calculEffectifsValides(
        validiteGroupe,
        nombreSalariesFemmes,
        nombreSalariesHommes
      );
      // ERM
      const ecartRemunerationMoyenne = calculEcartRemunerationMoyenne(
        remunerationAnnuelleBrutFemmes,
        remunerationAnnuelleBrutHommes
      );
      // ESP
      const ecartApresApplicationSeuilPertinence = calculEcartApresApplicationSeuilPertinence(
        ecartRemunerationMoyenne
      );

      return {
        validiteGroupe,
        effectifsValides,
        ecartRemunerationMoyenne,
        ecartApresApplicationSeuilPertinence
      };
    }
  );

  const {
    totalNombreSalariesFemmes,
    totalNombreSalariesHommes
  } = state.tranchesAges.reduce(
    (
      {
        totalNombreSalariesFemmes,
        totalNombreSalariesHommes,
        totalRemunerationAnnuelleBrutFemmes,
        totalRemunerationAnnuelleBrutHommes
      },
      {
        nombreSalariesFemmes,
        nombreSalariesHommes,
        remunerationAnnuelleBrutFemmes,
        remunerationAnnuelleBrutHommes
      }
    ) => {
      return {
        totalNombreSalariesFemmes:
          totalNombreSalariesFemmes + (nombreSalariesFemmes || 0),
        totalNombreSalariesHommes:
          totalNombreSalariesHommes + (nombreSalariesHommes || 0),
        totalRemunerationAnnuelleBrutFemmes:
          totalRemunerationAnnuelleBrutFemmes +
          (remunerationAnnuelleBrutFemmes || 0),
        totalRemunerationAnnuelleBrutHommes:
          totalRemunerationAnnuelleBrutHommes +
          (remunerationAnnuelleBrutHommes || 0)
      };
    },
    {
      totalNombreSalariesFemmes: 0, //TNBF
      totalNombreSalariesHommes: 0, //TNBH
      totalRemunerationAnnuelleBrutFemmes: 0,
      totalRemunerationAnnuelleBrutHommes: 0
    }
  );

  // TNB
  const totalNombreSalaries =
    totalNombreSalariesFemmes + totalNombreSalariesHommes;

  // TEV
  const totalEffectifsValides = computedDataByRow.reduce(
    (acc, { effectifsValides }) => acc + effectifsValides,
    0
  );

  const ecartsPonderesByRow = computedDataByRow.map(
    ({
      validiteGroupe,
      effectifsValides,
      ecartApresApplicationSeuilPertinence
    }: {
      validiteGroupe: boolean;
      effectifsValides: number;
      ecartApresApplicationSeuilPertinence: number;
    }) => {
      // EP
      const ecartPondere = calculEcartPondere(
        validiteGroupe,
        ecartApresApplicationSeuilPertinence,
        effectifsValides,
        totalEffectifsValides
      );

      return ecartPondere;
    }
  );

  // TEP
  const totalEcartPondere = ecartsPonderesByRow.reduce(
    (acc, val) => acc + val,
    0
  );

  const groupesValides = computedDataByRow.filter(
    ({ validiteGroupe }: { validiteGroupe: boolean }) => validiteGroupe
  );

  // IC
  const indicateurCalculable = calculIndicateurCalculable(
    totalNombreSalaries,
    totalEffectifsValides
  );

  // IER
  const indicateurEcartRemuneration = calculIndicateurEcartRemuneration(
    indicateurCalculable,
    totalEcartPondere
  );

  // NOTE
  const noteIndicateurUn = calculNote(indicateurEcartRemuneration);

  return (
    <Router>
      <div>
        <header css={styles.header}>
          <p>EGAPRO - Prototype</p>
        </header>
        <Route
          path="/"
          exact
          render={props => (
            <GroupEffectif
              {...props}
              effectif={state}
              updateEffectif={(group: Groupe) =>
                dispatch({ type: "updateEffectif", group })
              }
            />
          )}
        />
        <Route
          path="/groupvalid"
          exact
          render={props => (
            <GroupValid
              {...props}
              nombreGroupes={state.tranchesAges.length}
              nombreGroupesValides={groupesValides.length}
              nombreSalariesTotal={totalNombreSalaries}
              nombreSalariesGroupesValides={totalEffectifsValides}
              indicateurCalculable={indicateurCalculable}
            />
          )}
        />
        <Route
          path="/indicateur1"
          exact
          render={props => (
            <IndicateurUn
              {...props}
              effectif={state}
              updateEffectif={(group: Groupe) =>
                dispatch({ type: "updateIndicateurUn", group })
              }
            />
          )}
        />
        <Route
          path="/indicateur1result"
          exact
          render={props => (
            <IndicateurUnResult
              {...props}
              indicateurCalculable={indicateurCalculable}
              indicateurEcartRemuneration={indicateurEcartRemuneration}
              noteIndicateurUn={noteIndicateurUn}
            />
          )}
        />
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
