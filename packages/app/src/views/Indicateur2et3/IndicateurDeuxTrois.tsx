/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurDeuxTroisData
} from "../../globals";

import calculIndicateurDeuxTrois, {
  calculPlusPetitNombreSalaries,
  calculBarem
} from "../../utils/calculsEgaProIndicateurDeuxTrois";
import totalNombreSalaries from "../../utils/totalNombreSalaries";

import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";
import InfoBloc from "../../components/InfoBloc";
import ActionBar from "../../components/ActionBar";
import ActionLink from "../../components/ActionLink";
import {
  ButtonSimulatorLink,
  TextSimulatorLink
} from "../../components/SimulatorLink";
import {
  messageEcartNombreEquivalentSalaries,
  displayPercent,
  messageMesureCorrection
} from "../../utils/helpers";

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
    indicateurEcartAugmentationPromotion,
    indicateurEcartNombreEquivalentSalaries,
    indicateurSexeSurRepresente,
    noteIndicateurDeuxTrois,
    correctionMeasure
  } = calculIndicateurDeuxTrois(state);

  // le formulaire d'informations n'est pas validé
  if (state.informations.formValidated !== "Valid") {
    return (
      <PageIndicateurDeuxTrois>
        <InfoBloc
          title="vous devez renseignez vos informations d'entreprise avant d’avoir accès à cet indicateur"
          text={
            <TextSimulatorLink
              to="/informations"
              label="renseigner les informations"
            />
          }
        />
      </PageIndicateurDeuxTrois>
    );
  }

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
            text="car les effectifs comprennent moins de 5 femmes ou moins de 5 hommes."
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
    !state.indicateurDeuxTrois.presenceAugmentationPromotion
  ) {
    return (
      <PageIndicateurDeuxTrois>
        <div>
          <InfoBloc
            title="Malheureusement votre indicateur n’est pas calculable"
            text="car il n’y a pas eu d'augmentation durant la période de référence."
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

  const results = getResults(
    indicateurEcartAugmentationPromotion,
    indicateurEcartNombreEquivalentSalaries
  );

  const {
    totalNombreSalariesHomme: totalNombreSalariesHommes,
    totalNombreSalariesFemme: totalNombreSalariesFemmes
  } = totalNombreSalaries(state.effectif.nombreSalaries);
  const plusPetitNombreSalaries = calculPlusPetitNombreSalaries(
    totalNombreSalariesHommes,
    totalNombreSalariesFemmes
  );

  return (
    <PageIndicateurDeuxTrois>
      <LayoutFormAndResult
        childrenForm={
          <IndicateurDeuxTroisForm
            finPeriodeReference={state.informations.finPeriodeReference}
            presenceAugmentationPromotion={
              state.indicateurDeuxTrois.presenceAugmentationPromotion
            }
            nombreAugmentationPromotionFemmes={
              state.indicateurDeuxTrois.nombreAugmentationPromotionFemmes
            }
            nombreAugmentationPromotionHommes={
              state.indicateurDeuxTrois.nombreAugmentationPromotionHommes
            }
            periodeDeclaration={state.indicateurDeuxTrois.periodeDeclaration}
            nombreSalaries={state.effectif.nombreSalaries}
            readOnly={state.indicateurDeuxTrois.formValidated === "Valid"}
            updateIndicateurDeuxTrois={updateIndicateurDeuxTrois}
            validateIndicateurDeuxTrois={validateIndicateurDeuxTrois}
          />
        }
        childrenResult={
          state.indicateurDeuxTrois.formValidated === "Valid" && (
            <IndicateurDeuxTroisResult
              bestResult={results.best}
              indicateurSexeSurRepresente={indicateurSexeSurRepresente}
              noteIndicateurDeuxTrois={noteIndicateurDeuxTrois}
              correctionMeasure={correctionMeasure}
              validateIndicateurDeuxTrois={validateIndicateurDeuxTrois}
            />
          )
        }
      />
      {state.indicateurDeuxTrois.formValidated === "Valid" && (
        <AdditionalInfo
          results={results}
          indicateurSexeSurRepresente={indicateurSexeSurRepresente}
          plusPetitNombreSalaries={plusPetitNombreSalaries}
          correctionMeasure={correctionMeasure}
        />
      )}
    </PageIndicateurDeuxTrois>
  );
}

function PageIndicateurDeuxTrois({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Indicateur écart de taux d'augmentation"
      tagline="Le nombre de femmes et d’hommes ayant été augmentés durant la période de référence, ou pendant les deux ou trois dernières années."
    >
      {children}
    </Page>
  );
}

export type Result = { label: string; result: string; note: number };
export type Results = { best: Result; worst: Result };

export const getResults = (
  indicateurEcartAugmentationPromotion: number | undefined,
  indicateurEcartNombreEquivalentSalaries: number | undefined
): Results => {
  const ecartTaux = {
    label: "votre résultat en pourcentage est de",
    result:
      indicateurEcartAugmentationPromotion !== undefined
        ? displayPercent(indicateurEcartAugmentationPromotion)
        : "--",
    note:
      indicateurEcartAugmentationPromotion !== undefined
        ? calculBarem(indicateurEcartAugmentationPromotion)
        : 0
  };
  const ecartNbSalaries = {
    label: "votre résultat en nombre équivalent de salariés* est",
    result:
      indicateurEcartNombreEquivalentSalaries !== undefined
        ? `${indicateurEcartNombreEquivalentSalaries}`
        : "--",
    note:
      indicateurEcartNombreEquivalentSalaries !== undefined
        ? calculBarem(indicateurEcartNombreEquivalentSalaries)
        : 0
  };
  const results =
    indicateurEcartNombreEquivalentSalaries !== undefined &&
    indicateurEcartAugmentationPromotion !== undefined &&
    indicateurEcartNombreEquivalentSalaries <
      indicateurEcartAugmentationPromotion
      ? { best: ecartNbSalaries, worst: ecartTaux }
      : { worst: ecartNbSalaries, best: ecartTaux };
  return results;
};

export function AdditionalInfo({
  indicateurSexeSurRepresente,
  plusPetitNombreSalaries,
  correctionMeasure,
  results
}: {
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  plusPetitNombreSalaries: "hommes" | "femmes" | undefined;
  correctionMeasure: boolean;
  results: Results;
}) {
  return (
    <div css={styles.additionalInfo}>
      <p>
        {results.worst.label} <strong>{results.worst.result}</strong>, la note
        obtenue{" "}
        {correctionMeasure &&
          "avant prise en compte des mesures de correction "}
        est de <strong>{results.worst.note}/35</strong>
        <br />
        {results.worst.note < results.best.note &&
          "cette note n'a pas été retenue dans le calcul de votre index car elle est la moins favorable"}
      </p>
      <p>
        {messageEcartNombreEquivalentSalaries(
          indicateurSexeSurRepresente,
          plusPetitNombreSalaries
        )}
      </p>
      {correctionMeasure && (
        <p>
          {messageMesureCorrection(
            indicateurSexeSurRepresente,
            "d'augmentations",
            "35/35"
          )}
        </p>
      )}
    </div>
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

export default IndicateurDeuxTrois;
