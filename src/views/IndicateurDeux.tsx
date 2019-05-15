/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
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
  calculEffectifsIndicateurCalculable,
  calculIndicateurCalculable,
  calculIndicateurEcartAugmentation,
  calculNote
} from "../utils/calculsEgaProIndicateurDeux";

import Page from "../components/Page";
import LayoutFormAndResult from "../components/LayoutFormAndResult";
import InfoBloc from "../components/InfoBloc";
import ActionBar from "../components/ActionBar";
import ButtonLink from "../components/ButtonLink";
import ActionLink from "../components/ActionLink";

import IndicateurDeuxForm from "./IndicateurDeuxForm";
import IndicateurDeuxResult from "./IndicateurDeuxResult";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurDeux({ state, dispatch }: Props) {
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
  const effectifsIndicateurCalculable = calculEffectifsIndicateurCalculable(
    totalNombreSalaries,
    totalEffectifsValides
  );

  // IC
  const indicateurCalculable = calculIndicateurCalculable(
    state.indicateurDeux.presenceAugmentation,
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

  // le formulaire d'effectif n'est pas validé
  if (state.effectif.formValidated !== "Valid") {
    return (
      <PageIndicateurDeux>
        <div>
          <InfoBloc title="vous devez renseignez vos effectifs avant d’avoir accès à cet indicateur" />
          <ActionBar>
            <ButtonLink to="/effectifs" label="renseigner les effectifs" />
          </ActionBar>
        </div>
      </PageIndicateurDeux>
    );
  }

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable) {
    return (
      <PageIndicateurDeux>
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
      </PageIndicateurDeux>
    );
  }

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (state.indicateurDeux.formValidated === "Valid" && !indicateurCalculable) {
    return (
      <PageIndicateurDeux>
        <div>
          <InfoBloc
            title="Malheureusement votre indicateur n’est pas calculable"
            text="car il n’y a pas eu d’augmentation individuelle durant la période de référence."
          />
          <ActionBar>
            <ActionLink onClick={() => validateIndicateurDeux("None")}>
              modifier les données saisies
            </ActionLink>
          </ActionBar>
          <ActionBar>
            <ButtonLink to="/indicateur3" label="suivant" />
          </ActionBar>
        </div>
      </PageIndicateurDeux>
    );
  }

  return (
    <PageIndicateurDeux>
      <LayoutFormAndResult
        childrenForm={
          <IndicateurDeuxForm
            ecartAugmentParCategorieSocioPro={effectifEtEcartAugmentParGroupe}
            presenceAugmentation={state.indicateurDeux.presenceAugmentation}
            readOnly={state.indicateurDeux.formValidated === "Valid"}
            updateIndicateurDeux={updateIndicateurDeux}
            validateIndicateurDeux={validateIndicateurDeux}
          />
        }
        childrenResult={
          state.indicateurDeux.formValidated === "Valid" && (
            <IndicateurDeuxResult
              indicateurEcartAugmentation={indicateurEcartAugmentation}
              noteIndicateurDeux={noteIndicateurDeux}
              validateIndicateurDeux={validateIndicateurDeux}
            />
          )
        }
      />
    </PageIndicateurDeux>
  );
}

function PageIndicateurDeux({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Indicateur 2, écart de taux d’augmentation individuelle “hors promotion”"
      tagline="Renseignez le pourcentage d’hommes et des femmes ayant été augmentés durant la période de référence, par CSP."
    >
      {children}
    </Page>
  );
}

export default IndicateurDeux;
