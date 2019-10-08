/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurDeuxTroisData
} from "../../globals";

import calculIndicateurDeuxTrois from "../../utils/calculsEgaProIndicateurDeuxTrois";

import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";
import InfoBloc from "../../components/InfoBloc";
import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import {
  ButtonSimulatorLink,
  TextSimulatorLink
} from "../../components/SimulatorLink";

import IndicateurDeuxTroisForm from "./IndicateurDeuxTroisForm";
import IndicateurDeuxTroisResult from "./IndicateurDeuxTroisResult";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurDeuxTrois({ state, dispatch }: Props) {
  const updateIndicateurDeuxTrois = useCallback(
    (data: ActionIndicateurDeuxTroisData) =>
      dispatch({ type: "updateIndicateurDeuxTrois", data }),
    [dispatch]
  );

  const validateIndicateurDeuxTrois = useCallback(
    (valid: FormState) =>
      dispatch({ type: "validateIndicateurDeuxTrois", valid }),
    [dispatch]
  );

  const {
    effectifsIndicateurCalculable,
    // effectifEtEcartAugmentationPromotionParGroupe,
    indicateurCalculable,
    indicateurEcartAugmentationPromotion,
    indicateurSexeSurRepresente,
    noteIndicateurDeuxTrois,
    correctionMeasure
  } = calculIndicateurDeuxTrois(state);

  // le formulaire d'effectif n'est pas validé
  if (state.effectif.formValidated !== "Valid") {
    return (
      <PageIndicateurDeuxTrois>
        <InfoBloc
          title="vous devez renseignez vos effectifs avant d’avoir accès à cet indicateur"
          text={
            <TextSimulatorLink
              to="/effectifs"
              label="renseigner les effectifs"
            />
          }
        />
      </PageIndicateurDeuxTrois>
    );
  }

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable) {
    return (
      <PageIndicateurDeuxTrois>
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
      </PageIndicateurDeuxTrois>
    );
  }

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (
    state.indicateurDeuxTrois.formValidated === "Valid" &&
    !indicateurCalculable
  ) {
    return (
      <PageIndicateurDeuxTrois>
        <div>
          <InfoBloc
            title="Malheureusement votre indicateur n’est pas calculable"
            text="car il n’y a pas eu de promotion durant la période de référence."
          />
          <ActionBar>
            <ActionLink onClick={() => validateIndicateurDeuxTrois("None")}>
              modifier les données saisies
            </ActionLink>
          </ActionBar>
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur4" label="suivant" />
          </ActionBar>
        </div>
      </PageIndicateurDeuxTrois>
    );
  }

  return (
    <PageIndicateurDeuxTrois>
      <LayoutFormAndResult
        childrenForm={
          <IndicateurDeuxTroisForm
            presenceAugmentationPromotion={
              state.indicateurDeuxTrois.presenceAugmentationPromotion
            }
            nombreAugmentationPromotionFemmes={
              state.indicateurDeuxTrois.nombreAugmentationPromotionFemmes
            }
            nombreAugmentationPromotionHommes={
              state.indicateurDeuxTrois.nombreAugmentationPromotionHommes
            }
            memePeriodeReference={
              state.indicateurDeuxTrois.memePeriodeReference
            }
            periodeReferenceDebut={
              state.indicateurDeuxTrois.periodeReferenceDebut
            }
            periodeReferenceFin={state.indicateurDeuxTrois.periodeReferenceFin}
            readOnly={state.indicateurDeuxTrois.formValidated === "Valid"}
            updateIndicateurDeuxTrois={updateIndicateurDeuxTrois}
            validateIndicateurDeuxTrois={validateIndicateurDeuxTrois}
          />
        }
        childrenResult={
          state.indicateurDeuxTrois.formValidated === "Valid" && (
            <IndicateurDeuxTroisResult
              indicateurEcartAugmentationPromotion={
                indicateurEcartAugmentationPromotion
              }
              indicateurSexeSurRepresente={indicateurSexeSurRepresente}
              noteIndicateurDeuxTrois={noteIndicateurDeuxTrois}
              correctionMeasure={correctionMeasure}
              validateIndicateurDeuxTrois={validateIndicateurDeuxTrois}
            />
          )
        }
      />
    </PageIndicateurDeuxTrois>
  );
}

function PageIndicateurDeuxTrois({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Indicateur écart de taux d'augmentations et de promotions"
      tagline="Le nombre de femmes et d’hommes ayant été augmentés ou promus durant la période de référence, ou pendant les deux ou trois dernières années."
    >
      {children}
    </Page>
  );
}

export default IndicateurDeuxTrois;
