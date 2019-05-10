/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurUnData
} from "../globals.d";

import {
  calculEffectifsEtEcartRemuParTrancheAge,
  calculTotalEffectifs,
  calculEcartsPonderesParTrancheAge,
  calculTotalEcartPondere,
  calculIndicateurCalculable,
  calculIndicateurEcartRemuneration,
  calculNote
} from "../utils/calculsEgaProIndicateurUn";

import Page from "../components/Page";
import LayoutFormAndResult from "../components/LayoutFormAndResult";
import InfoBloc from "../components/InfoBloc";
import ActionBar from "../components/ActionBar";
import ButtonLink from "../components/ButtonLink";

import IndicateurUnForm from "./IndicateurUnForm";
import IndicateurUnResult from "./IndicateurUnResult";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurUn({ state, dispatch }: Props) {
  const updateIndicateurUn = useCallback(
    (data: ActionIndicateurUnData) =>
      dispatch({ type: "updateIndicateurUn", data }),
    [dispatch]
  );

  const validateIndicateurUn = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUn", valid }),
    [dispatch]
  );

  const effectifEtEcartRemuParTranche = calculEffectifsEtEcartRemuParTrancheAge(
    state.data
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
    <Page
      title="Indicateur 1, écart de rémunération"
      tagline="Renseignez la rémunération (annuelle / mensuelle) moyenne des femmes et
        des hommes par CSP et par tranche d’âge."
    >
      {indicateurCalculable && state.formEffectifValidated ? (
        <LayoutFormAndResult
          childrenForm={
            <IndicateurUnForm
              data={state.data}
              readOnly={state.formIndicateurUnValidated === "Valid"}
              updateIndicateurUn={updateIndicateurUn}
              validateIndicateurUn={validateIndicateurUn}
            />
          }
          childrenResult={
            state.formIndicateurUnValidated === "Valid" && (
              <IndicateurUnResult
                indicateurEcartRemuneration={indicateurEcartRemuneration}
                noteIndicateurUn={noteIndicateurUn}
                validateIndicateurUn={validateIndicateurUn}
              />
            )
          }
        />
      ) : (
        <div>
          <InfoBloc
            title="Malheureusement votre indicateur n’est pas calculable"
            text="car l’ensemble des groupes valables (c’est-à-dire comptant au
              moins 10 femmes et 10 hommes), représentent moins de 40% des
              effectifs."
          />
          <ActionBar>
            <ButtonLink to="/indicateur2" label="suivant" />
          </ActionBar>
        </div>
      )}
    </Page>
  );
}

export default IndicateurUn;
