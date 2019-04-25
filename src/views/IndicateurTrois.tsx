/** @jsx jsx */
import { jsx } from "@emotion/core";
import { RouteComponentProps, Route, Switch } from "react-router-dom";

import { Groupe, ActionType, ActionIndicateurTroisData } from "../globals.d";

import {
  calculEffectifsEtEcartPromoParCategorieSocioPro,
  calculTotalEffectifsEtTauxPromotion,
  calculEcartsPonderesParCategorieSocioPro,
  calculTotalEcartPondere,
  calculIndicateurCalculable,
  calculIndicateurEcartPromotion,
  calculNote
} from "../utils/calculsEgaProIndicateurTrois";

import IndicateurTroisStart from "./IndicateurTroisStart";
import IndicateurTroisForm from "./IndicateurTroisForm";
import IndicateurTroisResult from "./IndicateurTroisResult";

interface Props extends RouteComponentProps {
  state: Array<Groupe>;
  dispatch: (action: ActionType) => void;
}

function IndicateurTrois({ state, dispatch, match }: Props) {
  const updateIndicateurTrois = (data: ActionIndicateurTroisData) =>
    dispatch({ type: "updateIndicateurTrois", data });

  const effectifEtEcartPromoParGroupe = calculEffectifsEtEcartPromoParCategorieSocioPro(
    state
  );

  const {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxPromotionFemmes,
    totalTauxPromotionHommes
  } = calculTotalEffectifsEtTauxPromotion(effectifEtEcartPromoParGroupe);

  const ecartsPonderesByRow = calculEcartsPonderesParCategorieSocioPro(
    effectifEtEcartPromoParGroupe,
    totalEffectifsValides
  );

  // TEP
  const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow);

  // IC
  const indicateurCalculable = calculIndicateurCalculable(
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxPromotionFemmes,
    totalTauxPromotionHommes
  );

  // IEA
  const indicateurEcartPromotion = calculIndicateurEcartPromotion(
    indicateurCalculable,
    totalEcartPondere
  );

  // NOTE
  const noteIndicateurTrois = calculNote(indicateurEcartPromotion);

  return (
    <Switch>
      <Route
        path={match.path}
        exact
        render={props => (
          <IndicateurTroisStart
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
          <IndicateurTroisForm
            {...props}
            ecartPromoParCategorieSocioPro={effectifEtEcartPromoParGroupe}
            updateIndicateurTrois={updateIndicateurTrois}
          />
        )}
      />
      <Route
        path={`${match.path}/resultat`}
        render={props => (
          <IndicateurTroisResult
            {...props}
            indicateurCalculable={indicateurCalculable}
            indicateurEcartPromotion={indicateurEcartPromotion}
            noteIndicateurTrois={noteIndicateurTrois}
          />
        )}
      />
    </Switch>
  );
}

export default IndicateurTrois;
