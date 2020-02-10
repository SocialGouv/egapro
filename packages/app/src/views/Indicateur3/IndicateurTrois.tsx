/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurTroisData
} from "../../globals.d";

import calculIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois";

import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";
import InfoBloc from "../../components/InfoBloc";
import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import {
  ButtonSimulatorLink,
  TextSimulatorLink
} from "../../components/SimulatorLink";

import IndicateurTroisForm from "./IndicateurTroisForm";
import IndicateurTroisResult from "./IndicateurTroisResult";

import { messageMesureCorrection } from "../../utils/helpers";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurTrois({ state, dispatch }: Props) {
  const updateIndicateurTrois = useCallback(
    (data: ActionIndicateurTroisData) =>
      dispatch({ type: "updateIndicateurTrois", data }),
    [dispatch]
  );

  const validateIndicateurTrois = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurTrois", valid }),
    [dispatch]
  );

  const {
    effectifsIndicateurCalculable,
    effectifEtEcartPromoParGroupe,
    indicateurCalculable,
    indicateurEcartPromotion,
    indicateurSexeSurRepresente,
    noteIndicateurTrois,
    correctionMeasure
  } = calculIndicateurTrois(state);

  // le formulaire d'effectif n'est pas validé
  if (state.effectif.formValidated !== "Valid") {
    return (
      <PageIndicateurTrois>
        <InfoBloc
          title="vous devez renseignez vos effectifs avant d’avoir accès à cet indicateur"
          text={
            <TextSimulatorLink
              to="/effectifs"
              label="renseigner les effectifs"
            />
          }
        />
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
            <ButtonSimulatorLink to="/indicateur4" label="suivant" />
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
            <ButtonSimulatorLink to="/indicateur4" label="suivant" />
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
            presencePromotion={state.indicateurTrois.presencePromotion}
            readOnly={state.indicateurTrois.formValidated === "Valid"}
            updateIndicateurTrois={updateIndicateurTrois}
            validateIndicateurTrois={validateIndicateurTrois}
          />
        }
        childrenResult={
          state.indicateurTrois.formValidated === "Valid" && (
            <IndicateurTroisResult
              indicateurEcartPromotion={indicateurEcartPromotion}
              indicateurSexeSurRepresente={indicateurSexeSurRepresente}
              noteIndicateurTrois={noteIndicateurTrois}
              correctionMeasure={correctionMeasure}
              validateIndicateurTrois={validateIndicateurTrois}
            />
          )
        }
      />
      {state.indicateurTrois.formValidated === "Valid" && correctionMeasure && (
        <div css={styles.additionalInfo}>
          <p>
            {messageMesureCorrection(
              indicateurSexeSurRepresente,
              "de promotions",
              "15/15"
            )}
          </p>
        </div>
      )}
    </PageIndicateurTrois>
  );
}

function PageIndicateurTrois({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Indicateur écart de taux de promotion"
      tagline="Le pourcentage de femmes et d’hommes ayant été promus durant la période de référence, doit être renseigné par CSP."
    >
      {children}
    </Page>
  );
}

const styles = {
  additionalInfo: css({
    color: "#61676F",
    fontSize: 14,
    fontStyle: "italic",
    maxWidth: 500,
    "& > p": {
      marginBottom: 30
    }
  })
};

export default IndicateurTrois;
