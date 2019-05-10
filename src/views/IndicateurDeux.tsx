/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurDeuxData
} from "../globals.d";

import {
  calculEffectifsEtEcartAugmentParCategorieSocioPro,
  calculTotalEffectifsEtTauxAugmentation,
  calculEcartsPonderesParCategorieSocioPro,
  calculTotalEcartPondere,
  calculIndicateurCalculable,
  calculIndicateurEcartAugmentation,
  calculNote
} from "../utils/calculsEgaProIndicateurDeux";

import Page from "../components/Page";
import LayoutFormAndResult from "../components/LayoutFormAndResult";
import InfoBloc from "../components/InfoBloc";
import ActionBar from "../components/ActionBar";
import ButtonLink from "../components/ButtonLink";

import IndicateurDeuxForm from "./IndicateurDeuxForm";
import IndicateurDeuxResult from "./IndicateurDeuxResult";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurDeux({ state, dispatch, match }: Props) {
  const updateIndicateurDeux = useCallback(
    (data: ActionIndicateurDeuxData) =>
      dispatch({ type: "updateIndicateurDeux", data }),
    [dispatch]
  );

  const validateIndicateurDeux = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurDeux", valid }),
    [dispatch]
  );

  const effectifEtEcartAugmentParGroupe = calculEffectifsEtEcartAugmentParCategorieSocioPro(
    state.data
  );

  const {
    totalNombreSalaries,
    totalEffectifsValides,
    totalTauxAugmentationFemmes,
    totalTauxAugmentationHommes
  } = calculTotalEffectifsEtTauxAugmentation(effectifEtEcartAugmentParGroupe);

  const ecartsPonderesByRow = calculEcartsPonderesParCategorieSocioPro(
    effectifEtEcartAugmentParGroupe,
    totalEffectifsValides
  );

  // TEP
  const totalEcartPondere = calculTotalEcartPondere(ecartsPonderesByRow);

  // IC
  const indicateurCalculable = calculIndicateurCalculable(
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
  const noteIndicateurDeux = calculNote(indicateurEcartAugmentation);

  return (
    <Page
      title="Indicateur 2, écart de taux d’augmentation individuelle “hors promotion”"
      tagline="Renseignez le pourcentage d’hommes et des femmes ayant été augmentés durant la période de référence, par CSP."
    >
      {indicateurCalculable && state.formEffectifValidated ? (
        <LayoutFormAndResult
          childrenForm={
            <IndicateurDeuxForm
              ecartAugmentParCategorieSocioPro={effectifEtEcartAugmentParGroupe}
              readOnly={state.formIndicateurDeuxValidated === "Valid"}
              updateIndicateurDeux={updateIndicateurDeux}
              validateIndicateurDeux={validateIndicateurDeux}
            />
          }
          childrenResult={
            state.formIndicateurDeuxValidated === "Valid" && (
              <IndicateurDeuxResult
                indicateurCalculable={indicateurCalculable}
                indicateurEcartAugmentation={indicateurEcartAugmentation}
                noteIndicateurDeux={noteIndicateurDeux}
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
            <ButtonLink to="/indicateur3" label="suivant" />
          </ActionBar>
        </div>
      )}
    </Page>
  );
}

export default IndicateurDeux;
