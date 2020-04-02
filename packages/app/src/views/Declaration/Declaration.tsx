/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, Fragment, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionDeclarationData,
  DeclarationIndicateurUnData,
  DeclarationIndicateurDeuxData,
  DeclarationIndicateurTroisData,
  DeclarationIndicateurDeuxTroisData,
  DeclarationIndicateurQuatreData,
  DeclarationIndicateurCinqData,
  DeclarationEffectifData
} from "../../globals";

import calculIndicateurUn, {
  calculEcartTauxRemunerationParTrancheAgeCoef,
  calculEcartTauxRemunerationParTrancheAgeCSP
} from "../../utils/calculsEgaProIndicateurUn";
import calculIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux";
import calculIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois";
import calculIndicateurDeuxTrois from "../../utils/calculsEgaProIndicateurDeuxTrois";
import calculIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre";
import calculIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq";
import { calculNoteIndex } from "../../utils/calculsEgaProIndex";

import InfoBloc from "../../components/InfoBloc";
import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";

import DeclarationForm from "./DeclarationForm";
import RecapitulatifIndex from "../Recapitulatif/RecapitulatifIndex";
import { TextSimulatorLink } from "../../components/SimulatorLink";
import totalNombreSalaries from "../../utils/totalNombreSalaries";

interface Props extends RouteComponentProps {
  code: string;
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function Declaration({ code, state, dispatch }: Props) {
  const updateDeclaration = useCallback(
    (data: ActionDeclarationData) =>
      dispatch({ type: "updateDeclaration", data }),
    [dispatch]
  );

  const {
    totalNombreSalariesHomme,
    totalNombreSalariesFemme
  } = totalNombreSalaries(state.effectif.nombreSalaries);

  const nombreSalariesTotal =
    totalNombreSalariesFemme + totalNombreSalariesHomme;

  const {
    effectifsIndicateurCalculable: effectifsIndicateurUnCalculable,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente: indicateurUnSexeSurRepresente,
    noteIndicateurUn
  } = calculIndicateurUn(state);

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxCalculable,
    indicateurEcartAugmentation,
    indicateurSexeSurRepresente: indicateurDeuxSexeSurRepresente,
    correctionMeasure: indicateurDeuxCorrectionMeasure,
    noteIndicateurDeux
  } = calculIndicateurDeux(state);

  const {
    effectifsIndicateurCalculable: effectifsIndicateurTroisCalculable,
    indicateurEcartPromotion,
    indicateurSexeSurRepresente: indicateurTroisSexeSurRepresente,
    correctionMeasure: indicateurTroisCorrectionMeasure,
    noteIndicateurTrois
  } = calculIndicateurTrois(state);

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxTroisCalculable,
    indicateurEcartAugmentationPromotion,
    indicateurEcartNombreEquivalentSalaries,
    indicateurSexeSurRepresente: indicateurDeuxTroisSexeSurRepresente,
    correctionMeasure: indicateurDeuxTroisCorrectionMeasure,
    noteIndicateurDeuxTrois
  } = calculIndicateurDeuxTrois(state);

  const {
    indicateurEcartNombreSalarieesAugmentees,
    noteIndicateurQuatre
  } = calculIndicateurQuatre(state);

  const {
    indicateurSexeSousRepresente: indicateurCinqSexeSousRepresente,
    indicateurNombreSalariesSexeSousRepresente,
    noteIndicateurCinq
  } = calculIndicateurCinq(state);

  const trancheEffectifs = state.informations.trancheEffectifs;

  const allIndicateurValid =
    (state.indicateurUn.formValidated === "Valid" ||
      // Si l'indicateurUn n'est pas calculable par coefficient, forcer le calcul par CSP
      (!effectifsIndicateurUnCalculable && state.indicateurUn.csp)) &&
    (trancheEffectifs !== "50 à 250"
      ? (state.indicateurDeux.formValidated === "Valid" ||
          !effectifsIndicateurDeuxCalculable) &&
        (state.indicateurTrois.formValidated === "Valid" ||
          !effectifsIndicateurTroisCalculable)
      : state.indicateurDeuxTrois.formValidated === "Valid" ||
        !effectifsIndicateurDeuxTroisCalculable) &&
    state.indicateurQuatre.formValidated === "Valid" &&
    state.indicateurCinq.formValidated === "Valid";

  const effectifData: DeclarationEffectifData = {
    nombreSalariesTotal
  };

  const indicateurUnData: DeclarationIndicateurUnData = {
    nombreCoefficients: state.indicateurUn.csp
      ? undefined
      : state.indicateurUn.coefficient.length,
    motifNonCalculable: !effectifsIndicateurUnCalculable ? "egvi40pcet" : "",
    // TODO: demander le motif de non calculabilité si "autre" ?
    motifNonCalculablePrecision: "",
    remunerationAnnuelle: calculEcartTauxRemunerationParTrancheAgeCSP(
      state.indicateurUn.remunerationAnnuelle
    ),
    coefficient: calculEcartTauxRemunerationParTrancheAgeCoef(
      state.indicateurUn.coefficient
    ),
    resultatFinal: indicateurEcartRemuneration,
    sexeSurRepresente: indicateurUnSexeSurRepresente,
    noteFinale: noteIndicateurUn
  };

  const indicateurDeuxData: DeclarationIndicateurDeuxData = {
    motifNonCalculable: !effectifsIndicateurDeuxCalculable
      ? "egvi40pcet"
      : state.indicateurDeux.presenceAugmentation
      ? ""
      : "absaugi",
    // TODO: demander le motif de non calculabilité si "autre" ?
    motifNonCalculablePrecision: "",
    resultatFinal: indicateurEcartAugmentation,
    sexeSurRepresente: indicateurDeuxSexeSurRepresente,
    noteFinale: noteIndicateurDeux,
    mesuresCorrection: indicateurDeuxCorrectionMeasure
  };

  const indicateurTroisData: DeclarationIndicateurTroisData = {
    motifNonCalculable: !effectifsIndicateurTroisCalculable
      ? "egvi40pcet"
      : state.indicateurTrois.presencePromotion
      ? ""
      : "absprom",
    // TODO: demander le motif de non calculabilité si "autre" ?
    motifNonCalculablePrecision: "",
    resultatFinal: indicateurEcartPromotion,
    sexeSurRepresente: indicateurTroisSexeSurRepresente,
    noteFinale: noteIndicateurTrois,
    mesuresCorrection: indicateurTroisCorrectionMeasure
  };

  const indicateurDeuxTroisData: DeclarationIndicateurDeuxTroisData = {
    motifNonCalculable: !effectifsIndicateurDeuxTroisCalculable
      ? "etsno5f5h"
      : state.indicateurDeuxTrois.presenceAugmentationPromotion
      ? ""
      : "absaugi",
    // TODO: demander le motif de non calculabilité si "autre" ?
    motifNonCalculablePrecision: "",
    resultatFinalEcart: indicateurEcartAugmentationPromotion,
    resultatFinalNombreSalaries: indicateurEcartNombreEquivalentSalaries,
    sexeSurRepresente: indicateurDeuxTroisSexeSurRepresente,
    noteFinale: noteIndicateurDeuxTrois,
    mesuresCorrection: indicateurDeuxTroisCorrectionMeasure
  };

  const indicateurQuatreData: DeclarationIndicateurQuatreData = {
    motifNonCalculable: state.indicateurQuatre.presenceCongeMat
      ? state.indicateurQuatre.nombreSalarieesPeriodeAugmentation === 0
        ? "absaugpdtcm"
        : ""
      : "absretcm",
    // TODO: demander le motif de non calculabilité si "autre" ?
    motifNonCalculablePrecision: "",
    resultatFinal: indicateurEcartNombreSalarieesAugmentees,
    noteFinale: noteIndicateurQuatre
  };

  const indicateurCinqData: DeclarationIndicateurCinqData = {
    resultatFinal: indicateurNombreSalariesSexeSousRepresente,
    sexeSurRepresente:
      indicateurCinqSexeSousRepresente === "femmes"
        ? "hommes"
        : indicateurCinqSexeSousRepresente === "hommes"
        ? "femmes"
        : indicateurCinqSexeSousRepresente,
    noteFinale: noteIndicateurCinq
  };

  const { noteIndex, totalPoint, totalPointCalculable } = calculNoteIndex(
    trancheEffectifs,
    noteIndicateurUn,
    noteIndicateurDeux,
    noteIndicateurTrois,
    noteIndicateurDeuxTrois,
    noteIndicateurQuatre,
    noteIndicateurCinq
  );

  const validateDeclaration = useCallback(
    (valid: FormState) =>
      dispatch({
        type: "validateDeclaration",
        valid,
        effectifData,
        indicateurUnData,
        indicateurDeuxData,
        indicateurTroisData,
        indicateurDeuxTroisData,
        indicateurQuatreData,
        indicateurCinqData,
        noteIndex,
        totalPoint,
        totalPointCalculable
      }),
    [
      dispatch,
      effectifData,
      indicateurUnData,
      indicateurDeuxData,
      indicateurTroisData,
      indicateurDeuxTroisData,
      indicateurQuatreData,
      indicateurCinqData,
      noteIndex,
      totalPoint,
      totalPointCalculable
    ]
  );

  // tous les formulaires ne sont pas encore validés
  if (
    !allIndicateurValid ||
    state.informationsEntreprise.formValidated !== "Valid" ||
    state.informationsDeclarant.formValidated !== "Valid"
  ) {
    return (
      <PageDeclaration>
        <InfoBloc
          title="vous devez renseigner tous les indicateurs ainsi que les informations relatives à la déclaration avant de pouvoir valider"
          text="Certains des indicateurs et/ou certaines informations relatives à la déclaration sont manquantes"
        />
        <h2>Les formulaires suivants ne sont pas validés</h2>
        <ul>
          {state.indicateurUn.formValidated !== "Valid" &&
            ((!effectifsIndicateurUnCalculable && !state.indicateurUn.csp) ||
              effectifsIndicateurUnCalculable) && (
              <li>
                <TextSimulatorLink
                  to="/indicateur1"
                  label="l'indicateur écart de rémunération"
                />
              </li>
            )}
          {trancheEffectifs !== "50 à 250" &&
            state.indicateurDeux.formValidated !== "Valid" &&
            effectifsIndicateurDeuxCalculable && (
              <li>
                <TextSimulatorLink
                  to="/indicateur2"
                  label="l'indicateur écart de taux d'augmentations"
                />
              </li>
            )}
          {trancheEffectifs !== "50 à 250" &&
            state.indicateurTrois.formValidated !== "Valid" &&
            effectifsIndicateurTroisCalculable && (
              <li>
                <TextSimulatorLink
                  to="/indicateur3"
                  label="l'indicateur écart de taux de promotions"
                />
              </li>
            )}
          {trancheEffectifs === "50 à 250" &&
            state.indicateurDeuxTrois.formValidated !== "Valid" &&
            effectifsIndicateurDeuxTroisCalculable && (
              <li>
                <TextSimulatorLink
                  to="/indicateur2et3"
                  label="l'indicateur écart de taux d'augmentations"
                />
              </li>
            )}
          {state.indicateurQuatre.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink
                to="/indicateur4"
                label="l'indicateur retour de congé maternité"
              />
            </li>
          )}
          {state.indicateurCinq.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink
                to="/indicateur5"
                label="l'indicateur hautes rémunérations"
              />
            </li>
          )}
          {state.informationsEntreprise.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink
                to="/informations-entreprise"
                label="les informations entreprise/UES"
              />
            </li>
          )}
          {state.informationsDeclarant.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink
                to="/informations-declarant"
                label="les informations déclarant"
              />
            </li>
          )}
        </ul>
      </PageDeclaration>
    );
  }

  return (
    <PageDeclaration>
      <LayoutFormAndResult
        childrenForm={
          <Fragment>
            <RecapitulatifIndex
              allIndicateurValid={allIndicateurValid}
              noteIndex={noteIndex}
              totalPoint={totalPoint}
              totalPointCalculable={totalPointCalculable}
            />
            <DeclarationForm
              code={code}
              declaration={state.declaration}
              informationsDeclarant={state.informationsDeclarant}
              noteIndex={noteIndex}
              indicateurUnParCSP={state.indicateurUn.csp}
              readOnly={state.declaration.formValidated === "Valid"}
              updateDeclaration={updateDeclaration}
              validateDeclaration={validateDeclaration}
            />
          </Fragment>
        }
        childrenResult={null}
      />
    </PageDeclaration>
  );
}

function PageDeclaration({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Déclaration"
      tagline="Une fois toutes les informations relatives à la déclaration fournies dans les différents formulaires, validez votre déclaration"
    >
      {children}
    </Page>
  );
}

export default Declaration;
