/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurTroisData
} from "../globals.d";

import {
  calculEffectifsEtEcartPromoParCategorieSocioPro,
  calculTotalEffectifsEtTauxPromotion,
  calculEcartsPonderesParCategorieSocioPro,
  calculTotalEcartPondere,
  calculEffectifsIndicateurCalculable,
  calculIndicateurCalculable,
  calculIndicateurEcartPromotion,
  calculNote
} from "../utils/calculsEgaProIndicateurTrois";

import Page from "../components/Page";
import LayoutFormAndResult from "../components/LayoutFormAndResult";
import InfoBloc from "../components/InfoBloc";
import ActionBar from "../components/ActionBar";
import ButtonLink from "../components/ButtonLink";
import ActionLink from "../components/ActionLink";

import IndicateurTroisForm from "./IndicateurTroisForm";
import IndicateurTroisResult from "./IndicateurTroisResult";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurTrois({ state, dispatch, match }: Props) {
  const updateIndicateurTrois = useCallback(
    (data: ActionIndicateurTroisData) =>
      dispatch({ type: "updateIndicateurTrois", data }),
    [dispatch]
  );

  const validateIndicateurTrois = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurTrois", valid }),
    [dispatch]
  );

  const effectifEtEcartPromoParGroupe = calculEffectifsEtEcartPromoParCategorieSocioPro(
    state.data
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
  const effectifsIndicateurCalculable = calculEffectifsIndicateurCalculable(
    totalNombreSalaries,
    totalEffectifsValides
  );

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

  // le formulaire d'effectif n'est pas validé
  if (state.effectif.formValidated !== "Valid") {
    return (
      <PageIndicateurTrois>
        <div>
          <InfoBloc title="vous devez renseignez vos effectifs avant d’avoir accès à cet indicateur" />
          <ActionBar>
            <ButtonLink to="/effectifs" label="renseigner les effectifs" />
          </ActionBar>
        </div>
      </PageIndicateurTrois>
    );
  }

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable) {
    return (
      <PageIndicateurTrois>
        <div>
          <InfoBloc
            title="Malheureusement votre indicateur n’est pas calculable"
            text="car l’ensemble des groupes valables (c’est-à-dire comptant au
                moins 10 femmes et 10 hommes), représentent moins de 40% des
                effectifs."
          />
          <ActionBar>
            <ButtonLink to="/indicateur4" label="suivant" />
          </ActionBar>
        </div>
      </PageIndicateurTrois>
    );
  }

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (
    state.indicateurTrois.formValidated === "Valid" &&
    !indicateurCalculable
  ) {
    return (
      <PageIndicateurTrois>
        <div>
          <InfoBloc
            title="Malheureusement votre indicateur n’est pas calculable"
            text="car il n’y a pas eu de promotion durant la période de référence."
          />
          <ActionBar>
            <ActionLink onClick={() => validateIndicateurTrois("None")}>
              modifier les données saisies
            </ActionLink>
          </ActionBar>
          <ActionBar>
            <ButtonLink to="/indicateur4" label="suivant" />
          </ActionBar>
        </div>
      </PageIndicateurTrois>
    );
  }

  return (
    <PageIndicateurTrois>
      <LayoutFormAndResult
        childrenForm={
          <IndicateurTroisForm
            ecartPromoParCategorieSocioPro={effectifEtEcartPromoParGroupe}
            readOnly={state.indicateurTrois.formValidated === "Valid"}
            updateIndicateurTrois={updateIndicateurTrois}
            validateIndicateurTrois={validateIndicateurTrois}
          />
        }
        childrenResult={
          state.indicateurTrois.formValidated === "Valid" && (
            <IndicateurTroisResult
              indicateurEcartPromotion={indicateurEcartPromotion}
              noteIndicateurTrois={noteIndicateurTrois}
              validateIndicateurTrois={validateIndicateurTrois}
            />
          )
        }
      />
    </PageIndicateurTrois>
  );
}

function PageIndicateurTrois({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Indicateur 3, écart de taux de promotions"
      tagline="Renseignez le pourcentage de femmes et d’hommes ayant été promus durant la période de référence par CSP."
    >
      {children}
    </Page>
  );
}

export default IndicateurTrois;
