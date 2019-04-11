/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useState } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";

import {
  TranchesAges,
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges
} from "./globals.d";
import mapEnum from "./utils/mapEnum";

import GroupEffectif from "./views/GroupEffectif";
import GroupValid from "./views/GroupValid";
import IndicateurUn from "./views/IndicateurUn";
import IndicateurUnResult from "./views/IndicateurUnResult";

const baremeEcartRemuneration = [
  40,
  39,
  38,
  37,
  36,
  35,
  34,
  33,
  31,
  29,
  27,
  25,
  23,
  21,
  19,
  17,
  14,
  11,
  8,
  5,
  2,
  0
];

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

const defaultDataIndex: Groupe = {
  categorieSocioPro: CategorieSocioPro.Ouvriers,
  tranchesAges: [...baseTranchesAge]
};

const tauxEffectifValide = 40 / 100;

const seuilPertinence = 5 / 100;

function App() {
  const [dataIndex, setDataIndex] = useState(defaultDataIndex);

  const computedDataByRow = dataIndex.tranchesAges.map(
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
      const validiteGroupe =
        nombreSalariesFemmes >= 3 && nombreSalariesHommes >= 3;
      // EV
      const effectifsValides = validiteGroupe
        ? nombreSalariesFemmes + nombreSalariesHommes
        : 0;
      // ERM
      const ecartRemunerationMoyenne =
        remunerationAnnuelleBrutFemmes > 0 && remunerationAnnuelleBrutHommes > 0
          ? (remunerationAnnuelleBrutHommes - remunerationAnnuelleBrutFemmes) /
            remunerationAnnuelleBrutHommes
          : 0;
      // ESP
      const ecartApresApplicationSeuilPertinence =
        Math.sign(ecartRemunerationMoyenne) *
        Math.max(0, Math.abs(ecartRemunerationMoyenne) - seuilPertinence);

      return {
        validiteGroupe,
        effectifsValides,
        ecartRemunerationMoyenne,
        ecartApresApplicationSeuilPertinence
      };
    }
  );

  const reducedData = dataIndex.tranchesAges.reduce(
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
    reducedData.totalNombreSalariesFemmes +
    reducedData.totalNombreSalariesHommes;

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
      const ecartPondere = validiteGroupe
        ? (ecartApresApplicationSeuilPertinence * effectifsValides) /
          totalEffectifsValides
        : 0;

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
  const indicateurCalculable =
    totalNombreSalaries > 0 &&
    totalEffectifsValides >= totalNombreSalaries * tauxEffectifValide;

  // IER
  const indicateurEcartRemuneration = indicateurCalculable
    ? 100 * totalEcartPondere //.toFixed(1)
    : undefined;

  // NOTE
  const noteIndicateurUn = indicateurEcartRemuneration
    ? baremeEcartRemuneration[
        Math.min(21, Math.ceil(indicateurEcartRemuneration))
      ]
    : undefined;

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
              effectif={dataIndex}
              updateEffectif={setDataIndex}
            />
          )}
        />
        <Route
          path="/groupvalid"
          exact
          render={props => (
            <GroupValid
              {...props}
              nombreGroupes={dataIndex.tranchesAges.length}
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
              effectif={dataIndex}
              updateEffectif={setDataIndex}
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
