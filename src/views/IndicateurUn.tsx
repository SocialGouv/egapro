/** @jsx jsx */
import { jsx } from "@emotion/core";
import { RouteComponentProps, Route, Switch } from "react-router-dom";

import { Groupe, ActionType, ActionIndicateurUnData } from "../globals.d";

import {
  calculEffectifsEtEcartRemuParTrancheAge,
  calculTotalEffectifs,
  calculEcartsPonderesParTrancheAge,
  calculTotalEcartPondere,
  calculIndicateurCalculable,
  calculIndicateurEcartRemuneration,
  calculNote
} from "../utils/calculsEgaProIndicateurUn";

import IndicateurUnStart from "./IndicateurUnStart";
import IndicateurUnForm from "./IndicateurUnForm";
import IndicateurUnResult from "./IndicateurUnResult";

interface Props extends RouteComponentProps {
  state: Array<Groupe>;
  dispatch: (action: ActionType) => void;
}

function IndicateurUn({ state, dispatch, match }: Props) {
  const updateIndicateurUn = (data: ActionIndicateurUnData) =>
    dispatch({ type: "updateIndicateurUn", data });

  const effectifEtEcartRemuParTranche = calculEffectifsEtEcartRemuParTrancheAge(
    state
  );

  const { totalNombreSalaries, totalEffectifsValides } = calculTotalEffectifs(
    effectifEtEcartRemuParTranche
  );

  const ecartsPonderesByRow = calculEcartsPonderesParTrancheAge(
    effectifEtEcartRemuParTranche,
    totalEffectifsValides
  );

  // TEP
  const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow);

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
    <Switch>
      <Route
        path={match.path}
        exact
        render={props => (
          <IndicateurUnStart
            {...props}
            nombreSalariesTotal={totalNombreSalaries}
            nombreSalariesGroupesValides={totalEffectifsValides}
            indicateurCalculable={indicateurCalculable}
          />
        )}
      />
      <Route
        path={`${match.path}/categorieSocioPro/:categorieSocioPro`}
        render={props => (
          <IndicateurUnForm
            {...props}
            key={props.match.params.categorieSocioPro}
            effectif={state[props.match.params.categorieSocioPro]}
            updateIndicateurUn={updateIndicateurUn}
          />
        )}
      />
      <Route
        path={`${match.path}/resultat`}
        render={props => (
          <IndicateurUnResult
            {...props}
            indicateurCalculable={indicateurCalculable}
            indicateurEcartRemuneration={indicateurEcartRemuneration}
            noteIndicateurUn={noteIndicateurUn}
          />
        )}
      />
    </Switch>
  );
}

export default IndicateurUn;
