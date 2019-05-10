/** @jsx jsx */
import { jsx, css } from "@emotion/core";
import { useCallback } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurUnData
} from "../globals.d";

import globalStyles from "../utils/globalStyles";

import {
  calculEffectifsEtEcartRemuParTrancheAge,
  calculTotalEffectifs,
  calculEcartsPonderesParTrancheAge,
  calculTotalEcartPondere,
  calculIndicateurCalculable,
  calculIndicateurEcartRemuneration,
  calculNote
} from "../utils/calculsEgaProIndicateurUn";

import ButtonLink from "../components/ButtonLink";
import IndicateurUnForm from "./IndicateurUnForm";
import IndicateurUnResult from "./IndicateurUnResult";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurUn({ state, dispatch, match, history }: Props) {
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
    <div css={styles.bloc}>
      <p css={styles.blocTitle}>Indicateur 1, écart de rémunération</p>
      <p css={styles.blocSubtitle}>
        Renseignez la rémunération (annuelle / mensuelle) moyenne des femmes et
        des hommes par CSP et par tranche d’âge.
      </p>
      {indicateurCalculable && state.formEffectifValidated ? (
        <div css={styles.body}>
          <IndicateurUnForm
            data={state.data}
            readOnly={state.formIndicateurUnValidated === "Valid"}
            updateIndicateurUn={updateIndicateurUn}
            validateIndicateurUn={validateIndicateurUn}
          />
          {state.formIndicateurUnValidated === "Valid" && (
            <div css={styles.result}>
              <IndicateurUnResult
                indicateurEcartRemuneration={indicateurEcartRemuneration}
                noteIndicateurUn={noteIndicateurUn}
                validateIndicateurUn={validateIndicateurUn}
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          <div css={styles.indicatorUnavailable}>
            <p css={styles.indicatorUnavailableTitle}>
              Malheureusement votre indicateur n’est pas calculable
            </p>
            <p css={styles.indicatorUnavailableText}>
              car l’ensemble des groupes valables (c’est-à-dire comptant au
              moins 10 femmes et 10 hommes), représentent moins de 40% des
              effectifs.
            </p>
          </div>
          <div css={styles.action}>
            <ButtonLink to="/indicateur2" label="suivant" />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  bloc: css({
    display: "flex",
    flexDirection: "column",
    marginRight: globalStyles.grid.gutterWidth
  }),
  blocTitle: css({
    marginTop: 36,
    fontSize: 32
  }),
  blocSubtitle: css({
    marginTop: 12,
    marginBottom: 54,
    fontSize: 14
  }),

  body: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start"
  }),
  result: css({
    flex: 1,
    marginLeft: 16,
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column"
  }),

  indicatorUnavailable: css({
    padding: 16,
    backgroundColor: "#FFF",
    border: "1px solid #EFECEF"
  }),
  indicatorUnavailableTitle: css({
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase"
  }),
  indicatorUnavailableText: css({
    marginTop: 4,
    fontSize: 14,
    lineHeight: "17px"
  }),
  action: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 46,
    marginBottom: 36
  })
};

export default IndicateurUn;
