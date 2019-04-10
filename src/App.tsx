/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useState } from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

import { TranchesAges, CategorieSocioPro, Groupe } from "./globals.d";
import mapEnum from "./utils/mapEnum";
import GroupEffectif from "./views/GroupEffectif";

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
  tranchesAges: baseTranchesAge
  // tranchesAges: [
  //   {
  //     trancheAge: TranchesAges.MoinsDe30ans,
  //     ...baseGroupTranchesAgesState
  //   },
  //   {
  //     trancheAge: TranchesAges.De30a39ans,
  //     ...baseGroupTranchesAgesState
  //   },
  //   {
  //     trancheAge: TranchesAges.De40a49ans,
  //     ...baseGroupTranchesAgesState
  //   },
  //   {
  //     trancheAge: TranchesAges.PlusDe50ans,
  //     ...baseGroupTranchesAgesState
  //   }
  // ]
};

const sp = 5 / 100;

function App() {
  const [dataIndex, setDataIndex] = useState(defaultDataIndex);
  // const vg =
  //   nbSalarieFemmeField.meta.valueNumber >= 3 &&
  //   nbSalarieHommeField.meta.valueNumber >= 3;

  // const ev =
  //   nbSalarieFemmeField.meta.valueNumber + nbSalarieHommeField.meta.valueNumber;

  // const erm =
  //   (remuHommeField.meta.valueNumber - remuFemmeField.meta.valueNumber) /
  //   remuHommeField.meta.valueNumber;
  // const esp = Math.sign(erm) * Math.max(0, Math.abs(erm) - sp);

  // const tev = ev;

  // const ep = (esp * ev) / tev;

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
