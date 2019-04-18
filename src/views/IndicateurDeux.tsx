/** @jsx jsx */
import { jsx } from "@emotion/core";
import { RouteComponentProps, Route, Switch } from "react-router-dom";

import {
  TranchesAges,
  CategorieSocioPro,
  Groupe,
  GroupTranchesAges,
  ActionType,
  ActionIndicateurDeuxData
} from "../globals.d";

import {
  calculIndicateurDeuxEffectifsEtEcartAugmentParCategorieSocioPro,
  calculIndicateurDeuxTotalEffectifsEtTauxAugmentation,
  calculIndicateurDeuxEcartsPonderesParCategorieSocioPro,
  calculTotalEcartPondere,
  calculIndicateurDeuxCalculable,
  calculIndicateurEcartAugmentation,
  calculNoteIndicateurDeux
} from "../utils/calculsEgaPro";

import IndicateurDeuxStart from "./IndicateurDeuxStart";
import IndicateurDeuxForm from "./IndicateurDeuxForm";
import IndicateurDeuxResult from "./IndicateurDeuxResult";

interface Props extends RouteComponentProps {
  state: Array<Groupe>;
  dispatch: (action: ActionType) => void;
}

function IndicateurDeux({ state, dispatch, match }: Props) {
  const updateIndicateurDeux = (data: ActionIndicateurDeuxData) =>
    dispatch({ type: "updateIndicateurDeux", data });

  const effectifEtEcartAugmentParGroupe = calculIndicateurDeuxEffectifsEtEcartAugmentParCategorieSocioPro(
    state
  );

  const {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes
  } = calculIndicateurDeuxTotalEffectifsEtTauxAugmentation(
    effectifEtEcartAugmentParGroupe
  );

  const ecartsPonderesByRow = calculIndicateurDeuxEcartsPonderesParCategorieSocioPro(
    effectifEtEcartAugmentParGroupe,
    totalEffectifsValides
  );

  // TEP
  const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow);

  // IC
  const indicateurCalculable = calculIndicateurDeuxCalculable(
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes
  );

  // IEA
  const indicateurEcartAugmentation = calculIndicateurEcartAugmentation(
    indicateurCalculable,
    totalEcartPondere
  );

  // NOTE
  const noteIndicateurDeux = calculNoteIndicateurDeux(
    indicateurEcartAugmentation
  );

  console.log({
    effectifEtEcartAugmentParGroupe,
    totalEffectifsValides,
    ecartsPonderesByRow,
    totalEcartPondere,
    indicateurEcartAugmentation,
    noteIndicateurDeux
  });

  return (
    <Switch>
      <Route
        path={match.path}
        exact
        render={props => (
          <IndicateurDeuxStart
            {...props}
            nombreSalariesTotal={totalNombreSalaries}
            nombreSalariesGroupesValides={totalEffectifsValides}
            indicateurCalculable={indicateurCalculable}
          />
        )}
      />
      <Route
        path={`${match.path}/formulaire`}
        render={props => (
          <IndicateurDeuxForm
            {...props}
            ecartAugmentParCategorieSocioPro={effectifEtEcartAugmentParGroupe}
            updateIndicateurDeux={updateIndicateurDeux}
          />
        )}
      />
      <Route
        path={`${match.path}/resultat`}
        render={props => (
          <IndicateurDeuxResult
            {...props}
            indicateurCalculable={indicateurCalculable}
            indicateurEcartAugmentation={indicateurEcartAugmentation}
            noteIndicateurDeux={noteIndicateurDeux}
          />
        )}
      />
    </Switch>
  );
}

export default IndicateurDeux;
